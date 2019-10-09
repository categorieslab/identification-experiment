/* Active version of the Painting Identification Experiment. */

/* README: Steps of the code:
		1. First, paintings are randomly assigned names via the setup() function.
		2. Then, generateTrialLists() pregenerates a training list and testing list
			 in which each element is an array containing information about the stimiulus.
			 Look to initializeVariables for giant block of text explaining array indexing.
		3. Next, the experiment starts via $(window).load, which is line 596,
		   and participants see the instructions page.
		4. They go through the training list via the next() function, which first
			 displays a fixation cross, shows the first element of the training list,
			 displays feedback after response, removes the first element of training list,
			 and then repeats.
		5. After training list is completed, participants see the testing instructions,
			 after which they cycle through the test list via next().
		6. Finally, they encounter two post-experiment question pages: the metacognitive
		   html page and demographic html page. */

/* Initialize Psiturk object to keep track of experiment's pages. */
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

/* This array contains all the html pages to be used in this experiment.
		  - instructions/Active-Study.html: instructions before active learning phase.
      - instructions/TestingPhase.html: instructions before testing phase.
      - stage.html: stage on which we draw the stimulus.
      - postquestionnaire2.html: Contains a thank you and goodbye. */
var Pages = [
	"instructions/tryYourBest.html",
	"instructions/Active-Study.html",
	"instructions/TestingPhase.html",
	"stage.html",
	"metacognitive.html",
	"postquestionnaire2.html"
];

var ActiveInstructions = ["instructions/tryYourBest.html", "instructions/Active-Study.html"];

var TestingInstructions = ["instructions/TestingPhase.html"];

var AllImages = [
	"static/images/tryYourBest.png",
	"static/images/Bruno1.jpg",
	"static/images/Bruno2.jpg",
	"static/images/Bruno3.jpg",
	"static/images/Bruno4.jpg",
	"static/images/Bruno5.jpg",
	"static/images/Bruno6.jpg",
	"static/images/Bruno7.jpg",
	"static/images/Bruno8.jpg",
	"static/images/Ron1.jpg",
	"static/images/Ron2.jpg",
	"static/images/Ron3.jpg",
	"static/images/Ron4.jpg",
	"static/images/Ron5.jpg",
	"static/images/Ron6.jpg",
	"static/images/Ron7.jpg",
	"static/images/Ron8.jpg"
];

/* Preload all pages so that PsiTurk can speedily switch between them. */
psiTurk.preloadPages(Pages);
psiTurk.preloadPages(AllImages);

/* Global variables. startTime and currentTime keep track of duration of experiment. */
var brunoList, ronList, nameDictionary, allNames, experiment, trainingList,
		testList, currentList, debug, startTime, currentTime;

/* IMPORTANT:
	 	  We are creating a function that assigns the values of the global variables
	 declared above instead of assigning the values as they are declared due
	 to a weird psiturk feature: When psiTurk.showPage("stage.html") is called,
	 all global variables are reset to their last global assignment. This means
	 that if "var x; x = 1;" is declared directly in the code window, regardless
	 of any changes made to "x" via functions, psiTurk.showPage() will reset "x"
	 back to 1. However, this is not the case for global variables without global
	 assignments (i.e., solely "var x;"). In this case, psiTurk.showPage() will reset
	 "x" to its most recent assignment, not its last global assignment. In other
	 words, if a function assigns the value "2" to "x", "x" will still
	 remain a value of "2" after psiTurk.showPage() has finished--which is what
	 we want. We would like, for instance, the random assignment of names to paintings
	 to stay constant within participants.
	 		This is why, rather than globally assigning the following variables, we
	 are assigning them in this function, because this function's variable
	 assignment will not be the last assignment. */
function initializeVariables() {
	/* brunoList and ronList are indexed frequently by the setup functions. As it is
	   confusing which index belongs to which part of the lists, I have noted them
	   here:
	      - list[someNumber] = an array containing painter name, image path, sampling
	                           state and painting name.
	      - list[someNumber][0] = painter name
	      - list[someNumber][1] = image path
	      - list[someNumber][2] = sampling state (0 = not sampled, 1 = sampled). Look
	                              to choosePainting for the purpose of this.
	      - list[someNumber][3] = painting name
				- list[someNumber][4] = painting number */
	brunoList = [
	  ["Bruno", "Bruno1.jpg", 0, "", 1],
	  ["Bruno", "Bruno2.jpg", 0, "", 2],
	  ["Bruno", "Bruno3.jpg", 0, "", 3],
	  ["Bruno", "Bruno4.jpg", 0, "", 4],
	  ["Bruno", "Bruno5.jpg", 0, "", 5],
	  ["Bruno", "Bruno6.jpg", 0, "", 6],
	  ["Bruno", "Bruno7.jpg", 0, "", 7],
	  ["Bruno", "Bruno8.jpg", 0, "", 8]
	];

	ronList = [
	  ["Ron", "Ron1.jpg", 0, "", 9],
	  ["Ron", "Ron2.jpg", 0, "", 10],
	  ["Ron", "Ron3.jpg", 0, "", 11],
	  ["Ron", "Ron4.jpg", 0, "", 12],
	  ["Ron", "Ron5.jpg", 0, "", 13],
	  ["Ron", "Ron6.jpg", 0, "", 14],
	  ["Ron", "Ron7.jpg", 0, "", 15],
	  ["Ron", "Ron8.jpg", 0, "", 16]
	];

	/* Serves as an "answer key" for identification task. */
	nameDictionary = {
		"bep":0,
		"civ":0,
		"dem":0,
		"fum":0,
		"gog":0,
		"jop":0,
		"kiz":0,
		"lix":0,
		"nuk":0,
		"pif":0,
		"rab":0,
		"sot":0,
		"tex":0,
		"vin":0,
		"wup":0,
		"zat":0
	};

	/* Creates a list of painting names that can be randomized by the shuffle() function. */
	allNames = Object.keys(nameDictionary);

	/* Creates an object for this experiment:
	      - Blocks: number of blocks per phase. Currently 5 for study and later 2 for test.
			  - Stimuli: number of stimuli per block. Always 16.
	      - Current Trial: keeps track of the current trial of the experiment.
	      - Current View: What's displayed on the screen. Usually stage.html.
	      - Testing: Boolean on whether currently in testing phase.
	      - Condition: condition of test group.
				(Counterbalance 1 and 2 are provided by psiTurk in exp.html. If there are no
			   conditions to counterbalance, you can change this in config.txt.) */
	experiment = {
		blocks: 5,
		stimuli: brunoList.length + ronList.length,
		currentTrial: 0,
	  currentView: undefined,
		currentStim: undefined,
		testing: false,
	  condition: function() { return counterbalance1 == 1 ? "interleaved" : "blocked"; },
	};

	/* Set up condition for this experiment. */
	experiment.condition = experiment.condition();

	/* Set true to print useful debugging information.
	   Set false when running live. */
	debug = false;

	/* The order of displayed stimuli is pregenerated by the experiment. */
	trainingList = [];
	testList = [];
	currentList = [];
};

/* Shuffles an aray by swapping the current value -starting at the end of the
   array and traversing to the beginning- with a random value in the array. */
function shuffle(array){
	var currentIndex = array.length, nextIndex, temp;
	while(currentIndex !== 0) {
		nextIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		/* Value to move from index currentIndex is stored in temp. */
		temp = array[currentIndex];
		/* Value in currentIndex is now equal to the value in nextIndex. */
		array[currentIndex] = array[nextIndex];
		/* Value in nextIndex is now equal to temp. */
		array[nextIndex] = temp;
	}
	return array;
};

/* Fills in the empty list values for experiment. */
function setup() {
  /* Randomizes order of allNames. */
  allNames = shuffle(allNames);
  /* Assigns a painting name to each painting. */
  for (i = 0; i < 8; i++) {
		brunoList[i][3] = allNames[i];
		ronList[i][3] = allNames[i+8];
		/* Assigns the same paintings to the nameDictionary. */
		nameDictionary[ allNames[i]] = brunoList[i][4];
		nameDictionary[ allNames[i+8]] = ronList[i][4];
  }
};

/* Generates both the training list (varies by condition) and the test list. */
function generateTrialLists() {
	/* Generic counter. Necessary for while loops below. */
	var counter = 0;
  /* Generate interleaved list */
  if (experiment.condition === "interleaved") {
    /* Appends a pair of Bruno and Ron paintings, but the order of which is first
       in the pairing is randomized. */
    while (counter < (experiment.blocks*(experiment.stimuli/2))) {
      if (Math.round(Math.random()) === 0) {
        trainingList.push( choosePainting(brunoList), choosePainting(ronList));
      } else {
        trainingList.push( choosePainting(ronList), choosePainting(brunoList));
      }
      resetSamplingState(brunoList);
      resetSamplingState(ronList);
      counter++;
    }
  /* Generate blocked list */
  } else {
    /* First, randomly choose Bruno or Ron list, and append all eight paintings
       in random order. */
    if (Math.round(Math.random()) === 0) {
      trainingList = trainingList.concat( shuffle(brunoList));
    } else {
      trainingList = trainingList.concat( shuffle(ronList));
    }
    /* Then, choose the list not chosen from the previous block, and append all
       eight paintings in random order. Do this 9 times, for a total of
       10 painting blocks. (A block is the set of all paintings.) */
    while (counter < (experiment.blocks*2-1)) {
      if (trainingList[trainingList.length-1][0] == "Bruno") {
        trainingList = trainingList.concat( shuffle(ronList));
      } else {
        trainingList = trainingList.concat( shuffle(brunoList));
      }
      counter++;
    }
  }
  /* Generates a test list of 32 paintings, where each painting is shown twice. */
  testList = shuffle( testList.concat(brunoList, ronList));
	var temp = [];
	temp = shuffle( temp.concat(brunoList, ronList));
	testList = testList.concat(temp);
};

/* Chooses a random painting that does not have its second element as 0. */
function choosePainting(painter) {
  /* Randomizes unsampled until the painting indexed by unsampled has
  its third element as 0. */
  var unsampled;
  do {
    unsampled = (Math.round(Math.random() * (7-0) + 0));
  }
  while (painter[unsampled][2] === 1);
  /* Set to 1, so that above do statement will not reselect same painting. */
  painter[unsampled][2] = 1;
  /* Returns array containing painter, chosen painting, and name. */
  return painter[unsampled];
};

/* If all paintings have been sampled, reset painting sample state to 0. */
function resetSamplingState(painter) {
  /* The every() function returns true if every single painting has a sampled
     state of 1. In any other case, it returns false. */
  if (painter.every(checkUnsampled) === true) {
    for (i = 0; i < 8; i++) {
      painter[i][2] = 0;
    }
  }
};

/* This function is necessary for the every() function used above. */
function checkUnsampled(p) {
  return p[2] == 1;
};

/* Displays the painting in the current trial. */
function displayPainting(painting) {
	/* Displays the painting. */
	document.getElementById("paintingStim").innerHTML = "<img alt='painting' src='static/images/"+painting+"'>";
	/* Displays text onto screen. */
	d3.select(".instructions").text('Which painting is this?');
	d3.select(".guess").text('Please select a button');
	/* Displays the buttons whose onclick function is the wait alert. */
	document.getElementById("buttonsBeforeWait").style.display = "block";
	/* Participants must wait 500ms before responding. */
	setTimeout(function() {
		/* Removes the buttons whose onclick function is the wait alert. */
		document.getElementById("buttonsBeforeWait").style.display = "none";
		/* Displays buttons whose onclick function is an actual response. */
		document.getElementById("buttonsAfterWait").style.display = "block";
	}, 500);
};

/* Displays feedback and the current painting. */
function displayFeedback(feedback, paintingName, correct) {
	/* Clear buttons and instructions. */
	document.getElementById("buttonsAfterWait").style.display = "none";
	d3.select(".instructions").text("");
	d3.select(".guess").text("");
	/* Set color of feedback text according to correctness of answer. */
	if (correct) {
		document.getElementById("feedbackTag").style.color = "green";
	} else {
		document.getElementById("feedbackTag").style.color = "red";
	}
	/* Display feedback and correct answer. */
	d3.select(".feedback").text(feedback);
	d3.select(".identification").text(" This is painting " + paintingName);
};

/* Controls flow of experiment. */
var Experiment = function() {
	var responded,   		                  /* Has the participant in the active condition responded? */
		drawn,       		                  /* Has the image been drawn? */
		cheating,    		                  /* Is the participant attempting to cheat? */ //smh
		response = "";
/*
		if (debug) {
			console.log("Learning stimuli: "+);
			console.log("Array to be used: "+);
		}
*/

	/* Starts the experiment. Must call finishInstructions to satisfy Psiturk. */
	psiTurk.showPage("stage.html");
	psiTurk.finishInstructions();
	next();
};

/* Displays next slide. */
function next() {
	/* The following if statement is true when trial phases end. During the training
	   or testing phase the code will always jump down to the else condition in line 413. */
	if (currentList.length===0 && experiment.blocks===1) {
		if (!experiment.testing) {
			/* This function expression is defined so that it can recursively call itself until data is saved. */
			var saveTrainingData = function() {
				psiTurk.saveData({
					success: function() {
						/* Load debugging information. */
						if(debug) {
							console.log("Training data saved.");
							console.log(saveAttempt);
						}
						/* Hide "Please wait" message when saveData succeeds. */
						document.getElementById("pleaseWait").style.display = "none";
						/* Set up specifications for testing phase. */
						currentList = testList;
						experiment.currentTrial = 0;
						experiment.blocks = 2;
						experiment.testing = true;
						psiTurk.doInstructions(TestingInstructions,
																	 function(){ experiment.currentView = new Experiment();
																	});
					},
					/* When psiTurk.saveData fails, it re-runs after 5 seconds. */
					error: function() {
									 /* Counter increases each time .saveData is called and stops at 5 attempts. */
									 saveAttempt++;
									 /* Load debugging information. */
									 if (debug) {
										 console.log("Saving failed.");
										 console.log(saveAttempt);
									 }
									 /* If .saveData does not work after 6 attempts, simply move onto test phase
									    knowing that we will drop this participant anyway but not have to go
											through the hassle of responding to emails of confusion and doing a whoops y'all. */
									 if (saveAttempt === 6) {
										 /* Hide "Please wait" message. */
				 						document.getElementById("pleaseWait").style.display = "none";
				 						/* Set up specifications for testing phase. */
				 						currentList = testList;
				 						experiment.currentTrial = 0;
				 						experiment.blocks = 2;
				 						experiment.testing = true;
				 						psiTurk.doInstructions(TestingInstructions,
				 																	 function(){ experiment.currentView = new Experiment();
				 																	});
									 } else {
										 /* Display "Please wait" message if saveData fails. */
										 document.getElementById("pleaseWait").style.display = "block";
										 setTimeout(function() {
											 saveTrainingData();
										 }, 5000);
									 }
					}
				});
			};
			var saveAttempt = 0;
			saveTrainingData();
		} else {
					/* Record the time the participant completed the study. */
					var studyDuration = new Date().getTime() - startTime;
					psiTurk.recordTrialData( { "condition": experiment.condition,       // Active or Passive
																		 "testing": 1,                            // Testing or Learning
																		 "hit": "N/A",                            	// Response = category ? True or False
																		 "rt": "N/A",  															// Reaction time
																		 "painting": "N/A",        					      // Number of correct painting
																		 "paintingName": "N/A",    				      	// Name of correct painting
																		 "painter": "N/A",										    // Name of correct painter
																		 "chosenPainting": "N/A",		              // Number of chosen painting
																		 "response": "N/A",                	      // Name of chosen painting
																		 "trial": experiment.currentTrial,    	  // Current Trial
																		 "block": 0,                              // Current block. 0 makes it easier for analyzing
																		 "duration": studyDuration} );            // Duration elapsed since start time
					if(debug) {
						console.log("Recorded the following line of data: "
						+ "\ncondition: " + experiment.condition
						+ "\ntesting: " + "N/A"
						+ "\nhit: " + "N/A"
						+ "\nrt: " + "N/A"
						+ "\npainter: " + "N/A"
						+ "\npainting: " + "N/A"
						+ "\npaintingName: " + "N/A"
						+ "\nchosenPainting: " + "N/A"
						+ "\nresponse: " + "N/A"
						+ "\ntrial: " + experiment.currentTrial
						+ "\nblock: " + 0
						+ "\nduration: " + studyDuration);
					}
					/* Save testing data. */
					var saveTestingData = function () {
						psiTurk.saveData({
							success: function() {
								if (debug) {console.log("Testing data saved.");}
								/* Hide "Please wait" message when saveData succeeds. */
								document.getElementById("pleaseWait").style.display = "none";
								experiment.currentView = new thankYou();
							},
							error: function() {
											 /* Counter increases each time .saveData is called and stops at 5 attempts. */
											 saveAttempt++;
											 /* Load debugging information. */
											 if (debug) {
											   console.log("Saving failed.");
												 console.log(saveAttempt);
											 }
											 /* If .saveData does not work after 6 attempts, simply move onto test phase
											    knowing that we will drop this participant anyway but not have to go
													through the hassle of responding to emails of confusion and doing a whoops y'all. */
											 if (saveAttempt === 6) {
											   /* Hide "Please wait" message. */
						 						 document.getElementById("pleaseWait").style.display = "none";
												 experiment.currentView = new thankYou();
											 } else {
												 /* Display "Please wait" message if saveData fails. */
												 document.getElementById("pleaseWait").style.display = "block";
												 setTimeout(function() {
													 saveTestingData();
												 }, 5000);
											 }
							}
						});
					};
					var saveAttempt = 0;
					saveTestingData();
		}
	} else {
		/* experiment.currentTrial starts at 0. */
		experiment.currentTrial++;
		/* Decrements blocks at multiples of 16, + 1. For ex, 17, 33, 49, etc. */
		if (experiment.currentTrial>1 & experiment.currentTrial%experiment.stimuli===1) {
			experiment.blocks--;
		}
		/* Gets first stimulus. */
		experiment.currentStim = currentList.shift();
		/* Displays cross. */
		document.getElementById("fixation").style.display = "block";
		/* After 1000ms, cross is removed and painting is displayed. */
		setTimeout(function() {
								document.getElementById("fixation").style.display = "none";
								displayPainting(experiment.currentStim[1]);
								currentTime = new Date().getTime();
		}, 1000);
	}
};

/* Handles the responses. */
function responseHandler(response) {
	var hit = response == experiment.currentStim[3],
			rt = new Date().getTime() - currentTime,
			isTesting = experiment.testing ? 1 : 0;

	if (response.length == 3) {
		psiTurk.recordTrialData( { "condition": experiment.condition,             // Blocked or Interleaved
															 "testing": isTesting,                  				// Testing or Learning
															 "hit": hit,                            				// Response = category ? True or False
															 "rt": rt,  																		// Reaction time
															 "painting": experiment.currentStim[4],        					// Number of correct painting
															 "paintingName": experiment.currentStim[3],    				  // Name of correct painting
															 "painter": experiment.currentStim[0],									// Name of correct painter
															 "chosenPainting": nameDictionary[response],     // Number of chosen painting
															 "response": response,                          // Name of chosen painting
															 "trial": experiment.currentTrial,    			      // Current Trial
															 "block": experiment.blocks,            				// Current Block
															 "duration": 0} );                      				// By default, duration is only recorded at end of sets
		/* Useful for debugging. */
		if(debug) {
			console.log("Recorded the following line of data: "
			+ "\ncondition: " + experiment.condition
			+ "\ntesting: " + isTesting
			+ "\nresponse: " + response
			+ "\nchosenPainting: " + nameDictionary[response]
			+ "\npainter: " + experiment.currentStim[0]
			+ "\npainting: " + experiment.currentStim[4]
			+ "\npaintingName: " + experiment.currentStim[3]
			+ "\nhit: " + hit
			+ "\nrt: " + rt
			+ "\ntrial: " + experiment.currentTrial
			+ "\nblock: " + experiment.blocks
			+ "\nduration: " + 0);
		}
		/* Display feedback if not testing (aka training phase). */
		if (!experiment.testing) {
			/* Displays feedback and painting. */
			var feedback = response == experiment.currentStim[3] ? "Correct!" : "Incorrect!";
			displayFeedback(feedback, experiment.currentStim[3], hit);
			/* Removes image and texts from canvas after 2000ms. */
			setTimeout(function() {
									d3.select(".feedback").text("");
									d3.select(".identification").text("");
									document.getElementById("paintingStim").innerHTML = "";
									next();
			}, 2000);
		/* Don't display feedback. */
		} else {
			/* Removes buttons and instructions. */
			document.getElementById("buttonsAfterWait").style.display = "none";
			d3.select(".instructions").text("");
			d3.select(".guess").text("");
			/* Removes painting. */
			document.getElementById("paintingStim").innerHTML = "";
			/* Move onto next slide. */
			next();
		}
		response = "";
	}
};

var thankYou = function () {
	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";
	var question_number = 1;
	var answer;

	// Records data; Runs when the submit button is checked.
	record_responses = function() {
		var selectedVal = "";
		var selected = $("input[type='radio']:checked");
		if (selected.length > 0) {
			selectedVal = selected.val();
		}
		psiTurk.recordTrialData([question_number, selectedVal]);
		//increment question number
		question_number++;
	};

	// Triggers re-submitting task if 10 seconds have elapsed in failure.
	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	// Attempts to resubmit task
	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);

		psiTurk.saveData({
			success: function() {
					clearInterval(reprompt);
								psiTurk.computeBonus('compute_bonus',
									function(){
						experiment.currentView = new thankYou();
					});
			},
			error: prompt_resubmit
		});
	};

	//Load the questionnaire snippet
	psiTurk.saveData({
			success: function() {
								experiment.currentView = new metacognitiveQuestions();
							 },
			error: prompt_resubmit
	});
};

/* Presents participants with a metacognitive question asking how well they
	 think they did on the testing phase. */
metacognitiveQuestions = function() {
	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {
		sliderValue = document.getElementById("myRange").value;
		psiTurk.recordUnstructuredData("metacognitive", sliderValue);
	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);

		psiTurk.saveData({
			success: function() {
					clearInterval(reprompt);
								psiTurk.computeBonus('compute_bonus',
									function(){
						experiment.currentView = new metacognitiveQuestions();
					});
			},
			error: prompt_resubmit
		});
	};

	psiTurk.showPage("metacognitive.html");

	$("#next").click(function () {
			record_responses();
			psiTurk.saveData({
						success: function(){
									experiment.currentView = new demographicQuestions();
						},
						error: prompt_resubmit});
	});
};

/* Presents the participant with the demographic questions page, then completes the HIT */
demographicQuestions = function() {
	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {
		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);

		psiTurk.saveData({
			success: function() {
					clearInterval(reprompt);
								psiTurk.completeHIT();
			},
			error: prompt_resubmit
		});
	};

	psiTurk.showPage('postquestionnaire2.html');

	$("#next").click(function () {
			record_responses();
			psiTurk.saveData({
						success: function(){
									psiTurk.completeHIT();
						},
						error: prompt_resubmit});
	});
};

/* Begin Task */
$(window).load( function(){
	/* Sets up specifications for entire experiment. */
	initializeVariables();
	setup();
	generateTrialLists();
	currentList = trainingList;

	/* A list of pages you want to display in sequence. */
	var instructions = ActiveInstructions;

	/* Record the time the participant began the study. */
	startTime = new Date().getTime();

	/* Display instructions and then begin the experiment. */
 	psiTurk.doInstructions(
		instructions, function() { experiment.currentView = new Experiment(); }
 	);
});
