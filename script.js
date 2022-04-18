'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;
// including a map with my location

// app class entire user interface and manuplations classs
class App {
    click = 0;
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationGain.bind(this));

    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._moveOnclick.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        console.log(123);
      });
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    // jandling click on map
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationGain() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkOut(e) {
    e.preventDefault();
    const allFinit = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const type = inputType.value;
    // validating inputs
    // for runnig
    if (type === 'running') {
      const elevation = +inputElevation.value;

      if (
        !allFinit(duration, distance, elevation) ||
        !allPositive(duration, distance, elevation)
      )
        return alert('no valid values');

      workout = new Running(distance, duration, [lat, lng], elevation);
    }
    // for cycling
    if (type === 'cycling') {
      const cadence = +inputCadence.value;

      if (
        !allFinit(duration, distance, cadence) ||
        !allPositive(duration, distance, cadence)
      )
        return alert('no valid values');
      workout = new Cycling(distance, duration, [lat, lng], cadence);
    }
    this.#workouts.push(workout);
    this._renderWorkoutList(workout);
    this._renderWorkoutMap(workout);
    this._hideForm();
    // clearing all inputs
    inputDistance.value = inputDuration.value = inputCadence.value = '';
  }
  _renderWorkoutMap(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          calssName: `${workout.type}-popup`,
        })
      )
      .setPopupContent('workout')
      .openPopup();
  }
_hideForm(){
    form.style.opacity = 0;
}

  _renderWorkoutList(workout) {
    console.log(workout);
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'cycling' ? '🚴‍♂️' : '🏃‍♂️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
          `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
          `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveOnclick(e) {
    const workEL = e.target.closest('.workout');
    if (!workEL) return;

    const workout = this.#workouts.find(work => work.id === +workEL.dataset.id);
    console.log(workout);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  click() {
    thia.click++;
  }
}

// data classes
class Workout {
  date = new Date();
  id = Number((Date.now() + '').slice(-10));

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}
// child runnig class
class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.clacPace();
    this._setDescription();
  }
  clacPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration * 60);
    return this.speed;
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

const app = new App();
const work = new Workout(12, 13, [1.2, 1.3]);
