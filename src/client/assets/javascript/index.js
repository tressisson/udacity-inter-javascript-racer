// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
};

// Custom mapping for track and racer names
const myRacerName = {
	"Racer 1": "Luke",
	"Racer 2": "Lea",
	"Racer 3": "Han",
	"Racer 4": "Chewy",
	"Racer 5": "Yoda",
};

const myTrackName = {
	"Track 1": "Tatooine",
	"Track 2": "Death Star",
	"Track 3": "Endor",
	"Track 4": "Hoth",
	"Track 5": "Rebel Base",
	"Track 6": "Degobah",
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

async function onPageLoad() {
	try {
		getTracks().then((tracks) => {
			const html = renderTrackCards(tracks);
			renderAt("#tracks", html);
		});

		getRacers().then((racers) => {
			const html = renderRacerCars(racers);
			renderAt("#racers", html);
		});
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener(
		"click",
		function (event) {
			const { target } = event;

			// Race track form field
			if (target.matches(".card.track")) {
				handleSelectTrack(target);
			}

			// Podracer form field
			if (target.matches(".card.podracer")) {
				handleSelectPodRacer(target);
			}

			// call create race form
			if (target.matches("#submit-create-race")) {
				event.preventDefault();

				// function to start race
				handleCreateRace();
			}

			// Handle acceleration click event
			if (target.matches("#gas-peddle")) {
				handleAccelerate();
			}
		},
		false
	);
}

async function delay(ms) {
	try {
		return await new Promise((resolve) => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race
async function handleCreateRace() {
	try {
		// Get player_id and track_id from the store
		const { player_id, track_id } = store;
		//want to make sure that the track and racer have been selected
		if (!track_id) {
			alert("You need to select a track");
			return;
		} else if (!player_id) {
			alert("You need to select your racer");
			return;
		} else {
			// invoke the API call to create the race, then save the result
			const race = await createRace(player_id, track_id);

			// render starting UI
			renderAt("#race", renderRaceStartView(race.Track, race.Cars));

			// update the store with the race id
			// For the API to work properly, the race id should be race id - 1
			store.race_id = race.ID - 1;

			// The race has been created, now start the countdown
			// call the async function runCountdown
			await runCountdown();

			// call the async function startRace
			await startRace(store.race_id);

			// call the async function runRace
			await runRace(store.race_id);
		}
	} catch (error) {
		return console.log("Problem with handleCreateRace function::", error);
	}
}

function runRace(raceID) {
	return new Promise((resolve) => {
		// use Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(async () => {
			const res = await getRace(raceID);
			// if the race info status property is "in-progress", update the leaderboard by calling:
			if (res.status === "in-progress") {
				renderAt("#leaderBoard", raceProgress(res.positions));
			}
			// if the race info status property is "finished", run the following:
			if (res.status === "finished") {
				clearInterval(raceInterval);
				renderAt("#race", resultsView(res.positions));
				resolve(res); // resolve the promise
			}
		}, 500);
	}).catch((error) => console.log("Problem with runRace function::", error));
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise((resolve) => {
			// use Javascript's built in setInterval method to count down once per second
			const countdown = setInterval(() => {
				if (timer > 0) {
					// run this DOM manipulation to decrement the countdown for the user
					document.getElementById("big-numbers").innerHTML = --timer;
				} else {
					// if the countdown is done, clear the interval, resolve the promise, and return
					clearInterval(countdown);
					resolve(countdown);
				}
			}, 1000);
		});
	} catch (error) {
		console.log("Problem with runCountdown function::", error);
	}
}

function handleSelectPodRacer(target) {

	// remove class 'selected' from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");

	// save the selected racer to the store
	store.player_id = parseInt(target.id);
}

function handleSelectTrack(target) {

	// remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}
	// add class selected to current target
	target.classList.add("selected");
	// save the selected track id to the store (!Important convert to number type)
	store.track_id = parseInt(target.id);
}

function handleAccelerate() {
	console.log("accelerate button clicked");
	// Invoke the API call to accelerate
	accelerate(store.race_id).catch((error) =>
		console.log("Unable to invoke accelerate API call::", error)
	);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			  <h4>Loading Racers...</4>
		  `;
	}

	const results = racers.map(renderRacerCard).join("");

	return `
		  <ul id="racers">
			  ${results}
		  </ul>
	  `;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		  <li class="card podracer" id="${id}">
			  <h4>${myRacerName[driver_name]}</h4>
			  <p>Top speed: <strong>${top_speed}</strong></p>
			  <p>Acceleration: <strong>${acceleration}</strong></p>
			  <p>Handling: <strong>${handling}</strong></p>
		  </li>
	  `;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			  <h4>Loading Tracks...</4>
		  `;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		  <ul id="tracks">
			  ${results}
		  </ul>
	  `;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		  <li id="${id}" class="card track">
			  <h4>${myTrackName[name]}</h4>
		  </li>
	  `;
}

function renderCountdown(count) {
	return `
		  <h2>Race Starts In...</h2>
		  <p id="big-numbers">${count}</p>
	  `;
}

function renderRaceStartView(track, racers) {
	const { name } = track;
	return `
		  <header>
			  <h1>Race: ${myTrackName[name]}</h1>
		  </header>
		  <main id="two-columns">
			  <section id="leaderBoard">
				  ${renderCountdown(3)}
			  </section>
			  <section id="accelerate">
				  <h2>Directions</h2>
				  <p>Click the button as fast as you can to make your racer go faster!</p>
				  <button id="gas-peddle">Click Me To Win!</button>
			  </section>
		  </main>
		  <footer></footer>
	  `;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

	return `
		  <header>
			  <h1>Race Results</h1>
		  </header>
		  <main>
			  ${raceProgress(positions)}
			  <a href="/race">Start a new race</a>
		  </main>
	  `;
}

function raceProgress(positions) {
	const userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
	let count = 1;

	const results = positions.map((p) => {
		return `
			  <tr>
				  <td>
					  <h3>${count++} - ${p.driver_name}</h3>
				  </td>
			  </tr>
		  `;
	});

	return `
		  <main>
			  <h3>Leaderboard</h3>
			  <section id="leaderBoard">
				  ${results.join("")}
			  </section>
		  </main>
	  `;
}

function renderAt(element, html) {
	const node = document.querySelector(element);

	node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
	return {
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
}

// Make a fetch call (with error handling!) to each of the following API endpoints

// GET request to `${SERVER}/api/tracks`
function getTracks() {
	return fetch(`${SERVER}/api/tracks`)
		.then((response) => response.json())
		.catch((error) =>
			console.log("Problem with getTracks request to server::", error)
		);
}

// GET request to `${SERVER}/api/cars`
function getRacers() {
	return fetch(`${SERVER}/api/cars`)
		.then((response) => response.json())
		.catch((error) =>
			console.log("Problem with getRacers request to server::", error)
		);
}

// POST request to `${SERVER}/api/races`
function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return fetch(`${SERVER}/api/races`, {
		method: "POST",
		...defaultFetchOpts(),
		dataType: "jsonp",
		body: JSON.stringify(body),
	})
		.then((response) => response.json())
		.catch((error) =>
			console.log("Problem with createRace request to server::", error)
		);
}

// GET request to `${SERVER}/api/races/${id}`
function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`)
		.then((response) => response.json())
		.catch((error) =>
			console.log("Problem with getRace request to server::", error)
		);
}

// POST request to `${SERVER}/api/races/${id}/start`
function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: "POST",
		...defaultFetchOpts(),
	}).catch((error) =>
		console.log("Problem with startRace request to server::", error)
	);
}

// POST request to `${SERVER}/api/races/${id}/accelerate`
function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: "POST",
		...defaultFetchOpts(),
	}).catch((error) =>
		console.log("Problem with accelerate request to server::", error)
	);
}