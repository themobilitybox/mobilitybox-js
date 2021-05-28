const axios = require('axios');
const { cancelable } = require('cancelable-promise');

/**
 * The main class to interact with the The Mobilitybox API.
 */
export class Mobilitybox {
  /**
   * Create the API access object with your API key
   * @param {String} access_token You API Access Token
   * @param {String} base_url The base URL used (optional)
   * @property {String} session_token
   */
  constructor(access_token, base_url = "https://api.themobilitybox.com/v1") {
    this.access_token = access_token;
    this.base_url = base_url;
    this.session_token = null;
  }

  /**
   * Find stations by name
   * @param findOptions The query to use for station name search
   * @param {String} findOptions.query The query to use for station name search
   * @param {number} [findOptions.longitude] The longitude for the location bias (optional)
   * @param {number} [findOptions.latitude] The latitude for the location bias (optional)
   */
  find_stations_by_name({ query, longitude, latitude }){
    let uri = this.base_url+'/stations/search_by_name.json?query='+query
    if (typeof longitude == 'number' && typeof latitude == 'number') {
      uri += `&longitude=${longitude}&latitude=${latitude}`
    }

    return cancelable(axios.get(uri, {headers: get_request_headers(this) }))
      .then(response => {
        if (response.headers['session-token']){
          this.session_token = response.headers['session-token'];
        }
        return response.data.map((station_data)=> new MobilityboxStation(station_data, this));
      });
  }

  /**
   * Find stations by positions
   * @param {Object} position An object containing latitude and longitude for positions
   */
  find_stations_by_position(position){
    return cancelable(axios.get(this.base_url+'/stations/search_by_position.json?latitude='+position.latitude+'&longitude='+position.longitude, {headers: get_request_headers(this) }))
      .then(response => {
        if (response.headers['session-token']){
          this.session_token = response.headers['session-token'];
        }
        return response.data.map((station_data)=> new MobilityboxStation(station_data, this));
      })
  }

  /**
   * Find stations by id
   * @param {Object} id identifier of the station. Usually the start with: `vesputi:station:`
   * @param {Object} id_type (optional, default: mobilitybox) you can search also for id from other sources like dhid, delfi or mobilitybox
   */
  find_stations_by_id({id, id_type = 'mobilitybox'}){
    return cancelable(axios.get(this.base_url+'/stations/search_by_id.json?query='+id+'&id_type='+id_type, {headers: get_request_headers(this) }))
      .then(response => {
        if (response.headers['session-token']){
          this.session_token = response.headers['session-token'];
        }
        return new MobilityboxStation(response.data, this);
      })
  }

   /**
    * Get the attribution text and url to use in your app
    */
  get_attributions(){
    return cancelable(axios.get(this.base_url+'/attributions.json', {headers: get_request_headers(this) }))
      .then(response => {
        if (response.headers['session-token']){
          this.session_token = response.headers['session-token'];
        }
        return response.data;
      })
  }

   /**
    * Get a trip by ID
    * @param {String} trip_id The Trip ID
    */
  get_trip({id}){
    return cancelable(axios.get(this.base_url+'/trips/'+id+'.json', {headers: get_request_headers(this) }))
      .then(response => {
        if (response.headers['session-token']){
          this.session_token = response.headers['session-token'];
        }
        return new MobilityboxTrip(response.data, this);
      })
  }

  /**
   * Get a trip by its characteristics
   * @param {object} origins_from_station MobilityboxStop or Identifier of the first station of the trip. Usually they start with: `vesputi:station:`
   * @param {object} destination_station MobilityboxStop or Identifier of the last station of the trip. Usually they start with: `vesputi:station:`
   * @param {object} origins_from_departure_time The departure time of the origin station as a unix timestamp in milliseconds or a MobilityboxEventTime object
   * @param {object} destination_arrival_time The arrival time of the destination station as unix timestamp in milliseconds or as MobilityboxEventTime
   * @param {String} line_name The short name of the corresponding line
   * @return {Promise<MobilityboxTrip>} returns Promise to found MobilityboxTrip
   */
 find_trip_by_characteristics({origins_from_station, destination_station, origins_from_departure_time, destination_arrival_time, line_name}){
   const parsed_origins_from_station = (origins_from_station instanceof MobilityboxStation) ? origins_from_station.id : origins_from_station
   const parsed_destination_station = (destination_station instanceof MobilityboxStation) ? destination_station.id : destination_station
   const parsed_origins_from_departure_time = (origins_from_departure_time instanceof MobilityboxEventTime) ? origins_from_departure_time.scheduled_at.getTime() : origins_from_departure_time
   const parsed_destination_arrival_time = (destination_arrival_time instanceof MobilityboxEventTime) ? destination_arrival_time.scheduled_at.getTime() : destination_arrival_time

   const origins_from_station_id_query = "origins_from_station_id="+encodeURIComponent(parsed_origins_from_station)
   const origins_from_departure_time_query = "origins_from_departure_time="+parsed_origins_from_departure_time
   const destination_station_id_query = "destination_station_id="+encodeURIComponent(parsed_destination_station)
   const destination_arrival_time_query = "destination_arrival_time="+parsed_destination_arrival_time
   const line_name_query = "line_name="+line_name

   const query_string = `${origins_from_station_id_query}&${origins_from_departure_time_query}&${destination_station_id_query}&${destination_arrival_time_query}&${line_name ? line_name_query : ""}`
   return cancelable(axios.get(this.base_url+'/trips/search_by_characteristics.json?'+query_string, {headers: get_request_headers(this) }))
     .then(response => {
       if (response.headers['session-token']){
         this.session_token = response.headers['session-token'];
       }
       return new MobilityboxTrip(response.data, this);
     })
 }

  /**
   * Create a station from raw data
   * @param {StationDataHash} station_data Raw Station data
   */
  build_station(station_data){
    return new MobilityboxStation(station_data, this)
  }

  /**
   * Get a Mapbox compatible vector tile source
   * @deprecated Since version 3.2. Will be deleted in version 4.0. Use station_map_vector_tile_source instead.
   */
  vector_tile_source(){
    return {
      type: 'vector',
      tiles: [
        this.base_url + "/station_map/{z}-{x}-{y}.mvt?" + get_request_api_key_params(this)
      ]
    }
  }

  /**
   * Get a Mapbox compatible vector tile source including station and platform source layer
   */
  station_map_vector_tile_source(){
    return {
      type: 'vector',
      tiles: [
        this.base_url + "/station_map/{z}-{x}-{y}.mvt?" + get_request_api_key_params(this)
      ]
    }
  }

  /**
   * @deprecated Since version 3.2. Will be deleted in version 4.0. Use transit_map_vector_tile_source instead.
   */
  relevant_routes_vector_tile_source(){
    return {
      type: 'vector',
      tiles: [
        this.base_url + "/transit_map/{z}-{x}-{y}.mvt?" + get_request_api_key_params(this)
      ]
    }
  }

  /**
   * Get a Mapbox compatible vector tile source including paths of routes
   */
  transit_map_vector_tile_source(){
    return {
      type: 'vector',
      tiles: [
        this.base_url + "/transit_map/{z}-{x}-{y}.mvt?" + get_request_api_key_params(this)
      ]
    }
  }
}


const get_request_headers = (mobilitybox) => {
  var headers = {};
  if (mobilitybox.session_token){
    headers["Session-Token"] = mobilitybox.session_token;
  }
  if (mobilitybox.access_token){
    headers["Authorization"] = "Bearer " + mobilitybox.access_token;
  }
  return headers;
}

const get_request_api_key_params = (mobilitybox) => {
  if (mobilitybox.access_token){
    return "api_key="+mobilitybox.access_token
  }else{
    return ""
  }
}


/**
 * The class representing a single Station
 */
export class MobilityboxStation {
  /**
   * Create a station from raw data
   * @param {StationDataHash} station_data Raw Station data
   * @param {Mobilitybox} mobilitybox Mobilitybox object (the main API object)
   */
  constructor(station_data, mobilitybox) {
    this.id = station_data.id;
    this.name = station_data.name;
    this.position = null;
    if(station_data.position && typeof(station_data.position.latitude) === 'number' && typeof(station_data.position.longitude) === 'number'){
      this.position = {};
      this.position.latitude = station_data.position.latitude;
      this.position.longitude = station_data.position.longitude;
    }
    this.mobilitybox = mobilitybox;
  }

  /**
   * Fetch Next Departures for this Station
   * @param {Date} time A time to receive departures for (defaults to now)
   */
  get_next_departures(parameters) {
    const time = (!!parameters && !!parameters.time)?parameters.time:Date.now()
    return cancelable(axios
      .get(this.mobilitybox.base_url+'/departures.json?station_id='+this.id+'&time='+time, {headers: get_request_headers(this.mobilitybox)}))
      .then(response => {
        if (response.headers['session-token']){
          this.mobilitybox.session_token = response.headers['session-token'];
        }
        return response.data.map((departure_data)=> new MobilityboxDeparture(departure_data, this.mobilitybox));
      })
  }
}

/**
 * The class representing a Departure
 */
export class MobilityboxDeparture {
  constructor(departure_parameters, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.id = departure_parameters.trip.id || null;

    this.departure_time = new MobilityboxEventTime(departure_parameters.departure);
    this.platform = departure_parameters.departure.platform || null;

    this.headsign = departure_parameters.trip.headsign || null;
    this.line_name = departure_parameters.trip.line_name || null;
    this.type = departure_parameters.trip.type || {
      kind: null,
      product: null
    };

    this.provider = departure_parameters.trip.provider || null;

  }
}

export class MobilityboxEventTime {
  constructor(event_time_parameters, mobilitybox) {
    if(!event_time_parameters){
      this.scheduled_at = null;
      this.predicted_at = null;
    }else{
      this.scheduled_at = (event_time_parameters.scheduled_at)?new Date(event_time_parameters.scheduled_at):null;
      this.predicted_at = (event_time_parameters.predicted_at)?new Date(event_time_parameters.predicted_at):null;
    }
  }

  scheduled_at_formatted(){ return (!this.scheduled_at)?null:this._format_time(this.scheduled_at) };
  predicted_at_formatted(){ return (!this.predicted_at)?null:this._format_time(this.predicted_at) };
  scheduled_at_date_formatted(){ return (!this.scheduled_at)?null:this._format_date(this.scheduled_at) }
  predicted_at_date_formatted(){ return (!this.predicted_at)?null:this._format_date(this.predicted_at) }

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
   * @property {string} name - Name of the trip
   * @property {Array} stops - Raw stops data
   * @property {object} geojson - MultiLineString Geojson of trip path on the map
   */

  /**
   * Create a trip from raw data
   * @param {TripsHash} trip_parameters Raw Trip Parameters
   * @param {Mobilitybox} mobilitybox Mobilitybox object (the main API object)
   */
  constructor(trip_parameters, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.id = trip_parameters.id || null;
    this.name = trip_parameters.name || null;
    this.stops = (trip_parameters.stops || []).map((stop_data)=> new MobilityboxStop(stop_data, this.mobilitybox));
    this.geojson = trip_parameters.geojson || null;
  }

  /**
   * Receive a human-readable version of this trip.
   *
   * @return {String} Human-readable String representation
   */
  date_formatted(){
    var start_date_formatted = this.stops[0].departure.scheduled_at_date_formatted();
    var end_date_formatted = this.stops[this.stops.length-1].arrival.scheduled_at_date_formatted();

    if(start_date_formatted === end_date_formatted){
      return start_date_formatted;
    }else{
      return ""+start_date_formatted+" - "+end_date_formatted;
    }
  }

  /**
   * Receive the starting station for this trip.
   *
   * @return {MobilityboxStation} Startin Station
   */
  origins_from(){
    return this.stops[0].station;
  }

  /**
   * Receive the final destination station for this trip.
   *
   * @return {MobilityboxStation} Destination station
   */
  destination(){
    return this.stops[this.stops.length-1].station;
  }
}

/**
 * The class for a single stop in a trip
 */
export class MobilityboxStop {
  constructor(stop_parameters = {}, mobilitybox) {
    this.mobilitybox = mobilitybox;

    this.station = (!!stop_parameters.station)?new MobilityboxStation(stop_parameters.station):null;
    this.status = stop_parameters.status || null;
    this.arrival = new MobilityboxEventTime(stop_parameters.arrival);
    this.departure = new MobilityboxEventTime(stop_parameters.departure);
  }
}
