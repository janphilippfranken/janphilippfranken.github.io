function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        // swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function createTrialPages(condition) {
    let trialPages = '';
    let num_trials = 16;

    // read stories from a json file
    let response = await fetch(`batch_${condition}.json`);
    let trials = await response.json();
    shuffleArray(trials);

    window.trials = trials;

    for (let i = 1; i <= num_trials; i++) {
        let permissibilityQuestion = trials[i-1].permissibility_question.replace("did", "<span style='color: blue;'>did</span>");
        let intentionQuestion = trials[i-1].intention_question.replace("negative outcome", "<span style='color: red;'>negative outcome</span>");
        let questions = [permissibilityQuestion, intentionQuestion];

        let structureSentence = trials[i-1].structure_sentence;
        let modifiedSentence;

        // Split the sentence at the first comma, regardless of whether it's one or two sentences
        let parts = structureSentence.split(/,(.+)/);
        if (parts.length > 1) {
            modifiedSentence = parts[0] + ", <span style='color: red;'>" + parts[1] + "</span>";
        } else {
            // If there's no comma, leave the sentence as is
            modifiedSentence = structureSentence;
        }

        trialPages += `
            <div id="trial-page-${i}" class="page d-none">
                <h4> Story </h4>
                <p> ${trials[i-1].context} ${trials[i-1].opportunity}</p>

                <p> ${modifiedSentence}</p>

                <p> ${trials[i-1].evitability_sentence}</p>

                <p> <span style='color: blue;'>${trials[i-1].action_sentence}</span></p>
        `;

        for (let q = 1; q <= 2; q++) {
            trialPages += `
                <div class="question" id="question-${i}-${q}">
                    <p><b>Statement ${q}</b>: ${questions[q-1]}</p>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-1" value="1">
                        <label class="form-check-label" for="likert-${i}-${q}-1">Strongly Disagree</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-2" value="2">
                        <label class="form-check-label" for="likert-${i}-${q}-2">Disagree</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-3" value="3">
                        <label class="form-check-label" for="likert-${i}-${q}-3">Neutral</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-4" value="4">
                        <label class="form-check-label" for="likert-${i}-${q}-4">Agree</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-5" value="5">
                        <label class="form-check-label" for="likert-${i}-${q}-5">Strongly Agree</label>
                    </div>
                </div>
                <br>
            `;
        }

        trialPages += `</div>`;
    }

    // add trial pages to the HTML
    var $trialPages = $("#trial-pages");
    $trialPages.append(trialPages);
}


$(document).ready(function () {
    
    let surveyData = {};
    surveyData.prolificPid = getUrlParameter("participant_id");
    surveyData.studyId = getUrlParameter("experiment_id");
    surveyData.condition = getUrlParameter("condition");

    createTrialPages(surveyData.condition).then(() => {


    let currentPage = 0;
    let totalPages = $(".page").length;
    let progressStep = 100 / totalPages;


    // console.log(surveyData);
    function updateProgressBar() {
        let progress = progressStep * (currentPage + 1);
        $("#progress-bar").css("width", progress + "%").attr("aria-valuenow", progress);
    }


    function showPage(index) {
        $(".page").addClass("d-none");
        $(".page:eq(" + index + ")").removeClass("d-none");
        updateProgressBar();

        if (index === totalPages - 1) { // Check if it's the last page (exit survey)
            $("#next-btn").addClass("d-none");
            $("#submit-btn").removeClass("d-none");
        } else {
            $("#next-btn").removeClass("d-none");
            $("#submit-btn").addClass("d-none");
        }
    }

    function validateComprehensionTest() {
        // Check if the correct answers are selected
        const correctAnswers = {
            "comprehension-1": "true",
            "comprehension-2": "false",
            "comprehension-3": "true",
        };
    
        for (const question in correctAnswers) {
            const selectedAnswer = $(`input[name="${question}"]:checked`).val();
            if (selectedAnswer !== correctAnswers[question]) {
                return false;
            }
        }
    
        return true;
    }

    function submitExitSurvey() {
        // Gather trial page answers
        surveyData.trialPages = {};
        let num_trials = 16;
        for (let i = 1; i <= num_trials; i++) {
            let trialData = window.trials[i-1];
            surveyData.trialPages[`trial${i}`] = {
                likertResponses: {},
                permissibility_question: trialData.permissibility_question,
                intention_question: trialData.intention_question,
                context: trialData.context,
                opportunity: trialData.opportunity,
                structure_sentence: trialData.structure_sentence,
                evitability_sentence: trialData.evitability_sentence,
                action_sentence: trialData.action_sentence,
                scenario_id: trialData.scenario_id,
                condition: trialData.condition,
            };
            for (let q = 1; q <= 2; q++) {
                surveyData.trialPages[`trial${i}`].likertResponses[`likert${q}`] = $('input[name="likert-' + i + '-' + q + '"]:checked').val();
            }
        }

        surveyData.exitSurvey = {
            age: $("#age").val(),
            gender: $("#gender").val(),
            race: $("#race").val(),
            ethnicity: $("#ethnicity").val(),
            // Add more input fields as needed
        };

    
        // Submit the survey data using proliferate
        console.log('submitting');
        console.log(surveyData);
        proliferate.submit(surveyData); // Uncomment this line when you're ready to use Proliferate
        // Show a thank you message or redirect to a thank you page
        // alert("Thank you for completing the survey!");
    }
    
    $("#submit-btn").click(function () {
        // Check if all the demographic fields have been filled
        if($("#age").val() && $("#gender").val() && $("#race").val() && $("#ethnicity").val()){
            if ($("#age").val() < 18 || $("#age").val() > 120) {
                alert("Please enter a valid age between 18 and 120.");
            }
            else{
                submitExitSurvey();
            }
        }
        // Check if age is between 18 and 120

         else {
            alert("Please fill out all the demographic fields.");
        }
    });

    function goToNextPage() {
        currentPage++;
        if (currentPage === totalPages) {
            $("#next-btn").prop("disabled", true);
        }
        if (currentPage > 0) {
            $("#prev-btn").removeClass("d-none");
        }
        showPage(currentPage);
    }

    function goToPrevPage() {
        currentPage--;
        if (currentPage === 0) {
            $("#prev-btn").addClass("d-none");
        }
        if (currentPage < totalPages) {
            $("#next-btn").prop("disabled", false);
        }
        showPage(currentPage);
    }

    $("#next-btn").click(function () {
        if (currentPage === 0) {
            goToNextPage();
        } else if (currentPage === 5) {
            if (validateComprehensionTest()) {
                goToNextPage();
            } else {
                alert("Please answer the comprehension test questions correctly.");
            }
        } else {
            goToNextPage();
        }
        updateNextButtonState();
    });

    $("#prev-btn").click(function () {
        goToPrevPage();
        updateNextButtonState();
    });

    function checkAllAnswered() {
        let allAnswered = true;
        // Get all question sets on the current page
        let questionSets = $(`.page:eq(${currentPage}) .question`);
    
        questionSets.each(function() {
            // Check if this question set has a selected answer
            if (!$(this).find('input[type="radio"]').is(':checked')) {
                allAnswered = false;
                return false; // Exit the loop
            }
        });
    
        return allAnswered;
    }
    
    function updateNextButtonState() {
        // Get all input elements on the current page
        if (currentPage === 0 && !$("#consent-checkbox").is(":checked")) {
            $("#next-btn").prop("disabled", true);
        }
        else if (currentPage === 0 && $("#consent-checkbox").is(":checked")){
            $("#next-btn").prop("disabled", false);
        } 
        else if (currentPage >= 6) {
            if (checkAllAnswered()) {
                $("#next-btn").prop("disabled", false);
            } else {
                $("#next-btn").prop("disabled", true);
            }
        }
    }

    $(document).on('click', 'input[type="radio"]', updateNextButtonState); 

    showPage(currentPage);
    updateNextButtonState();
    $("#consent-checkbox").change(function () {
        updateNextButtonState();
    });
});
});
