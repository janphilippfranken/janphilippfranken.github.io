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
    let num_trials = 40;

    // create a list of the questions

    // read stories rom a json file
    // let response = await fetch(`https://kanishkg.github.io/batch_${condition}.json`);
    let response = await fetch('counterbalance_1.json');
    let trials = await response.json();
    shuffleArray(trials);

    window.trials = trials;
    // console.log(trials);

    for (let i = 1; i <= num_trials; i++) {

        trialPages += `
            <div id="trial-page-${i}" class="page d-none">
                <h4> Scenario </h4>
                <p><b>Background sentence</b>: ${trials[i-1].background}</p>

                <p><b>Target sentence</b>: ${trials[i-1].target}</p>`;
        
        for (let q = 1; q <= 1; q++) {
            trialPages += `<div class="question" id="question-${i}-${q}">`;
            trialPages += `
            <p>Rate how good or bad the event in the target sentence is (<b>Note</b> that good is on the left while bad is on the right):</p>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-7" value="7">
                    <label class="form-check-label" for="likert-${i}-${q}-7">Very Good</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-6" value="6">
                    <label class="form-check-label" for="likert-${i}-${q}-6">Good</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-5" value="5">
                    <label class="form-check-label" for="likert-${i}-${q}-5">Somewhat Good</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-4" value="4">
                    <label class="form-check-label" for="likert-${i}-${q}-4">Neither Good nor Bad</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-3" value="3">
                    <label class="form-check-label" for="likert-${i}-${q}-3">Somewhat Bad</label>
                </div>
                 <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-2" value="2">
                    <label class="form-check-label" for="likert-${i}-${q}-2">Bad</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="likert-${i}-${q}" id="likert-${i}-${q}-1" value="1">
                    <label class="form-check-label" for="likert-${i}-${q}-1">Very Bad</label>
                </div>
            <br><br></div>
                    `;
        }
        trialPages += `
                </form>
            </div>`;
    }
    // add trial pages to the html
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
        for (let i = 1; i <= 40; i++) {
            let trialData = window.trials[i-1];
            surveyData.trialPages[`trial${i}`] = {
                likertResponses: {},
                background: trialData.background,
                target: trialData.target,
                scenario_id: trialData.scenario_id,
                structure: trialData.structure,
                type: trialData.type,
                strength: trialData.strength,
            };
            for (let q = 1; q <= 1; q++) {
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
