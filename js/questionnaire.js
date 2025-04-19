/**
 * Questionnaire Handling Functions for Robo Advisor
 * Manages the risk profiling questionnaire and risk profile calculation
 */

// Show current question
function showCurrentQuestion() {
    const questionContainer = document.getElementById('question-container');
    const currentQuestionIndex = appState.currentQuestionIndex;
    
    if (currentQuestionIndex < questionnaireData.questions.length) {
        const question = questionnaireData.questions[currentQuestionIndex];
        const options = questionnaireData.options[currentQuestionIndex];
        
        // Create question HTML
        let html = `
            <div class="mb-4">
                <h3 class="text-xl font-semibold">Question ${currentQuestionIndex + 1} of ${questionnaireData.questions.length}</h3>
                <p class="text-lg mt-2">${question}</p>
            </div>
            <div class="space-y-3">
        `;
        
        // Add options
        options.forEach((option, index) => {
            const isSelected = appState.questionResponses[currentQuestionIndex] === index + 1;
            html += `
                <div class="p-3 rounded-lg ${isSelected ? 'bg-blue-100 border-blue-500 border-2' : 'bg-white border border-gray-300 hover:bg-gray-50'}" 
                     data-option="${index + 1}" 
                     onclick="selectOption(${index + 1})">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="question-${currentQuestionIndex}" value="${index + 1}" 
                               ${isSelected ? 'checked' : ''} class="mr-2">
                        <span>${option}</span>
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Update container
        questionContainer.innerHTML = html;
        
        // Update progress
        document.getElementById('question-progress').textContent = `Question ${currentQuestionIndex + 1} of ${questionnaireData.questions.length}`;
        const progressPercentage = ((currentQuestionIndex + 1) / questionnaireData.questions.length) * 100;
        document.getElementById('question-progress-bar').style.width = `${progressPercentage}%`;
        
        // Update buttons
        document.getElementById('btn-prev-question').disabled = currentQuestionIndex === 0;
        document.getElementById('btn-next-question').textContent = 
            currentQuestionIndex === questionnaireData.questions.length - 1 ? 'Submit' : 'Next Question';
    }
}

// Handle option selection
function selectOption(optionValue) {
    // Update response for current question
    appState.questionResponses[appState.currentQuestionIndex] = optionValue;
    
    // Update UI to show selection
    const options = document.querySelectorAll('#question-container [data-option]');
    options.forEach(option => {
        if (parseInt(option.dataset.option) === optionValue) {
            option.classList.add('bg-blue-100', 'border-blue-500', 'border-2');
            option.classList.remove('bg-white', 'border-gray-300', 'hover:bg-gray-50');
            option.querySelector('input').checked = true;
        } else {
            option.classList.remove('bg-blue-100', 'border-blue-500', 'border-2');
            option.classList.add('bg-white', 'border-gray-300', 'hover:bg-gray-50');
            option.querySelector('input').checked = false;
        }
    });
}

// Handle previous question button
function handlePrevQuestion() {
    if (appState.currentQuestionIndex > 0) {
        appState.currentQuestionIndex--;
        showCurrentQuestion();
    }
}

// Handle next question button
function handleNextQuestion() {
    // If no option is selected, show alert
    if (!appState.questionResponses[appState.currentQuestionIndex]) {
        alert('Please select an option before proceeding.');
        return;
    }
    
    // If this is the last question, submit questionnaire
    if (appState.currentQuestionIndex === questionnaireData.questions.length - 1) {
        navigateTo('section-risk-profile');
        return;
    }
    
    // Otherwise, go to next question
    appState.currentQuestionIndex++;
    showCurrentQuestion();
    
    // Update progress
    const progress = Math.min(20 + Math.floor(40 * (appState.currentQuestionIndex / questionnaireData.questions.length)), 60);
    updateProgress(progress);
}

// Reset questionnaire
function resetQuestionnaire() {
    appState.currentQuestionIndex = 0;
    appState.questionResponses = [];
    showCurrentQuestion();
}

// Calculate risk profile based on questionnaire responses
function calculateRiskProfile() {
    // Calculate total score - in this case, higher scores mean more risk tolerance
    const totalScore = appState.questionResponses.reduce((sum, response) => sum + response, 0);
    
    // Calculate the final risk score (inverted)
    const finalScore = 96 - totalScore; // For a 16-question survey with 5 points per question
    
    // Map to risk aversion parameter and risk profile
    let riskProfile, riskAversion;
    
    if (finalScore >= 76) {
        riskProfile = "Aggressive";
        riskAversion = 1.5;
    } else if (finalScore >= 61) {
        riskProfile = "Growth-Oriented";
        riskAversion = 2.5;
    } else if (finalScore >= 46) {
        riskProfile = "Moderate";
        riskAversion = 3.5;
    } else if (finalScore >= 31) {
        riskProfile = "Conservative";
        riskAversion = 6.0;
    } else {
        riskProfile = "Very Conservative";
        riskAversion = 12.0;
    }
    
    // Extract investment knowledge and time horizon from responses
    const knowledgeLevel = appState.questionResponses[3]; // Question 4
    const timeHorizon = appState.questionResponses[1]; // Question 2
    
    const knowledgeLabels = ["Very Limited", "Basic", "Moderate", "Good", "Advanced"];
    const timeHorizonLabels = ["< 3 years", "3-5 years", "6-10 years", "11-20 years", "> 20 years"];
    
    // Update application state
    appState.riskProfile = riskProfile;
    appState.riskAversion = riskAversion;
    appState.knowledgeLevel = knowledgeLabels[knowledgeLevel - 1];
    appState.timeHorizon = timeHorizonLabels[timeHorizon - 1];
    
    // Update UI
    updateRiskProfileUI();
}

// Update risk profile UI
function updateRiskProfileUI() {
    // Update risk profile result
    const riskProfileResult = document.getElementById('risk-profile-result');
    riskProfileResult.innerHTML = `
        <h3 class="text-2xl font-bold mb-3">Your Risk Profile: <span class="text-blue-700">${appState.riskProfile}</span></h3>
        <p class="mb-3">Risk Aversion Parameter: ${appState.riskAversion}</p>
        <p class="mb-3">${riskProfiles[appState.riskProfile].description}</p>
        <div class="bg-blue-100 p-3 rounded">
            <h4 class="font-semibold mb-1">Recommended Asset Allocation:</h4>
            <p>${riskProfiles[appState.riskProfile].recommendedAssetMix}</p>
        </div>
    `;
    
    // Update risk profile explanation
    const riskProfileExplanation = document.getElementById('risk-profile-explanation');
    riskProfileExplanation.innerHTML = `
        <p class="mb-4">Based on your responses to our comprehensive questionnaire, we've determined that your investment approach aligns with a <strong>${appState.riskProfile}</strong> risk profile. This assessment considers your time horizon, investment knowledge, financial situation, and psychological comfort with market fluctuations.</p>
        <p>Your profile suggests you should consider a portfolio that balances risk and return in a way that aligns with your personal preferences and financial goals.</p>
    `;
    
    // Update time horizon content
    const timeHorizonContent = document.getElementById('time-horizon-content');
    timeHorizonContent.innerHTML = `
        <p class="mb-2">Your selected time horizon: <strong>${appState.timeHorizon}</strong></p>
        <p>${riskProfiles[appState.riskProfile].timeHorizonAdvice}</p>
    `;
    
    // Update investment knowledge content
    const investmentKnowledgeContent = document.getElementById('investment-knowledge-content');
    investmentKnowledgeContent.innerHTML = `
        <p class="mb-2">Your investment knowledge: <strong>${appState.knowledgeLevel}</strong></p>
        <p>${riskProfiles[appState.riskProfile].knowledgeAdvice}</p>
    `;
    
    // Create risk dial chart
    createRiskDialChart(appState.riskProfile);
}