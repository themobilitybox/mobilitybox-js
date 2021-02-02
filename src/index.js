const axios = require('axios');

/**
 * The main class to interact with the The Mobilitybox API.
 */
export class Mobilitybox {
  /**
   * Create the API access object with your API key
   * @param {String} access_token You API Access Token
   * @param {String} base_url The base URL used (optional)
   */
  constructor(access_token, base_url = "https://api.themobilitybox.com/v1") {
    this.access_token = access_token;
    this.base_url = base_url;
  }

  /**
   * This callback gets stations from an async function.
   * @callback stationCallback
   * @param {MobilityboxStation[]} stations
   */

  /**
   * Find stations by name
   * @param {String} query The query to use for station name search
   * @param {stationCallback} callback A callback receiving the stations
   */
  find_stations_by_name(query, callback){
    axios.get(this.base_url+'/stations/search_by_name.json?query='+query)
      .then(response => callback(response.data.map((station_data)=> new MobilityboxStation(station_data, this))))
  }

  /**
   * Find stations by positions
   * @param {Object} position An object containing latitude and longitude for positions
   * @param {stationCallback} callback A callback receiving the stations
   */
  find_stations_by_position(position, callback){
    axios.get(this.base_url+'/stations/search_by_position.json?latitude='+position.latitude+'&longitude='+position.longitude)
      .then(response => callback(response.data.map((station_data)=> new MobilityboxStation(station_data, this))))
  }

  /**
   * @typedef AttributionsHash
   * @type {object}
   * @property {string} html - The html-version
   * @property {string} text - The text-only version
   * @property {string} url - The URL to link to
  */

  /**
   * This callback gets an object with an HTML/text-only version of
   * @callback attributionsCallback
   * @param {AttributionsHash} attributions
   */

   /**
    * Get the attribution text and url to use in your app
    * @param {attributionsCallback} callback A callback receiving the attributions as HTML, text and a URL
    */
  get_attributions(callback){
    axios.get(this.base_url+'/attributions.json')
      .then(response => callback(response.data))
  }

  /**
   * This callback receives a trip.
   * @callback tripCallback
   * @param {MobilityboxTrip} attributions
   */

   /**
    * Get a trip by ID
    * @param {String} trip_id The Trip ID
    * @param {tripCallback} callback A callback receiving a single trip
    */
  get_trip(trip_id, callback){
    axios.get(this.base_url+'/trips/'+trip_id+'.json')
      .then(response => callback(new MobilityboxTrip(response.data, this)))
  }
}

/**
 * The class representing a single Station
 */
export class MobilityboxStation {
  /**
   * @typedef StationDataHash
   * @type {object}
   * @property {string} id - Station ID
   * @property {string} name - Name of the Station
   */

  /**
   * Create a station from raw data
   * @param {StationDataHash} station_data Raw Station data
   * @param {Mobilitybox} mobilitybox Mobilitybox object (the main API object)
   */
  constructor(station_data, mobilitybox) {
    this.id = station_data.id;
    this.name = station_data.name;
    this.mobilitybox = mobilitybox;
  }

  /**
   * This callback receives departures
   * @callback departuresCallback
   * @param {MobilityboxDeparture[]} departures
   */

  /**
   * Fetch Next Departures for this Station
   * @param {departuresCallback} callback A callback receiving departures for this station and time
   * @param {Date} time A time to receive departures for (defaults to now)
   */
  get_next_departures(callback, time = Date.now()) {
    axios.get(this.mobilitybox.base_url+'/departures.json?station_id='+this.id+'&time='+time)
      .then(response => callback(response.data.map((station_data)=> new MobilityboxDeparture(station_data, this.mobilitybox))))
  }
}

/**
 * The class representing a Departure
 */
export class MobilityboxDeparture {
  constructor(departure_parameters, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.id = departure_parameters.trip.id;

    this.departure_time = new MobilityboxEventTime(departure_parameters.departure)
    this.platform = departure_parameters.departure.platform;

    this.headsign = departure_parameters.trip.headsign;
    this.line_name = departure_parameters.trip.line_name;
    this.type = departure_parameters.trip.type;

    this.provider = departure_parameters.trip.provider;

  }
}

export class MobilityboxEventTime {
  constructor(event_time_parameters, mobilitybox) {
    if(!event_time_parameters){
      this.scheduled_at = null;
      this.predicted_at = null;
    }else{
      this.scheduled_at = new Date(event_time_parameters.scheduled_at);
      this.predicted_at = new Date(event_time_parameters.predicted_at);
    }
  }

  scheduled_at_formated(){ return (!this.scheduled_at)?"":this._format_time(this.scheduled_at) };
  predicted_at_formated(){ return (!this.predicted_at)?"":this._format_time(this.predicted_at) };
  scheduled_at_date_formated(){ return (!this.scheduled_at)?"":this._format_date(this.scheduled_at) }

  _format_time(time){
    return ""+time.getHours()+':'+("00" + time.getMinutes()).slice (-2)
  }

  _format_date(time){
    return time.toLocaleDateString('de-DE');
  }
}

/**
 * This class represents a single trip.
 */
export class MobilityboxTrip {
  /**
   * @typedef TripsHash
   * @type {object}
   * @property {string} id - Trip ID
   * @property {string} name - Name of the strip
   * @property {Array} stops - Raw stops data
   */

  /**
   * Create a trip from raw data
   * @param {TripsHash} trip_parameters Raw Trip Parameters
   * @param {Mobilitybox} mobilitybox Mobilitybox object (the main API object)
   */
  constructor(trip_parameters, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.id = trip_parameters.id;
    this.name = trip_parameters.name;
    this.stops = trip_parameters.stops.map((stop_data)=> new MobilityboxStop(stop_data, this.mobilitybox));
  }

  /**
   * Receive a human-readable version of this trip.
   *
   * @return {String} Human-readable String representation
   */
  date_formated(){
    var start_date_formated = this.stops[0].departure.scheduled_at_date_formated();
    var end_date_formated = this.stops[this.stops.length-1].arrival.scheduled_at_date_formated();

    if(start_date_formated === end_date_formated){
      return start_date_formated;
    }else{
      return ""+start_date_formated+" - "+end_date_formated;
    }
  }

  /**
   * Receive the starting station for this trip.
   *
   * @return {MobilityboxStation} Startin Station
   */
  from_station(){
    return this.stops[0].station;
  }

  /**
   * Receive the final destination station for this trip.
   *
   * @return {MobilityboxStation} Destination station
   */
  to_station(){
    return this.stops[this.stops.length-1].station;
  }
}

/**
 * The class for a single stop in a trip
 */
export class MobilityboxStop {
  constructor(stop_parameters, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.station = new MobilityboxStation(stop_parameters.station);
    this.status = stop_parameters.status;
    this.departure = new MobilityboxEventTime(stop_parameters.departure);
    this.arrival = new MobilityboxEventTime(stop_parameters.arrival);
  }
}
