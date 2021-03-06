import { Mobilitybox, MobilityboxStation, MobilityboxDeparture, MobilityboxTrip, MobilityboxEventTime, MobilityboxStop } from './index.js'
import { expect } from 'chai';
import nock from 'nock'
const { v4: uuidv4 } = require('uuid');

// Configure Axios (http-framework) for getting compatible with nock (mocking http-requests)
import axios from 'axios';
axios.defaults.adapter = require('axios/lib/adapters/http');

function mock(path, return_value, query, request_headers, response_headers){
  return nock('https://api.themobilitybox.com', {reqheaders: request_headers})
  .get('/v1'+path)
  .query(query || true)
  .reply(200, return_value, response_headers)
}

describe('Mobilitybox', ()=>{
  describe('attributes',()=>{
    it('initializes with an api token', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.access_token).to.equal("abc");
    });

    it('answers with 401 if no api key is provided', ()=>{
      const mobilitybox = new Mobilitybox();

      nock('https://api.themobilitybox.com')
        .get('/v1/attributions.json')
        .reply(401, "the request must contain at least one of [api_key in query-parameters, Authorization-Header]")

      mobilitybox.get_attributions().catch((error) => {
        expect(error).to.have.status(401);
      })
    });

    it('can initialize without a base url', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.base_url).to.equal("https://api.themobilitybox.com/v1");
    });

    it('can initialize with a given base url', ()=>{
      const mobilitybox = new Mobilitybox('abc', 'https://foobar.lol/v42');
      expect(mobilitybox.base_url).to.equal("https://foobar.lol/v42");
    });

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();

      mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"}, null, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token})
      return mobilitybox.get_attributions().then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });

    it('does use saved session token in mobilitybox class for request and get the same back', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const session_token = uuidv4()
      mobilitybox.session_token = session_token

      mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"}, null, {'Authorization': 'Bearer abc', 'Session-Token': session_token }, {'Session-Token': session_token})
      return mobilitybox.get_attributions().then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    })

    it('does not update session_token if response has no session-token header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const session_token = uuidv4()
      mobilitybox.session_token = session_token

      mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"}, null, {'Authorization': 'Bearer abc', 'Session-Token': session_token })
      return mobilitybox.get_attributions().then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    })

  });

  describe('get_attributions()',()=>{
    it('returns proper attributions', ()=>{
      const mobilitybox = new Mobilitybox('abc');

      mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"})

      return mobilitybox.get_attributions().then((attributions)=>{
        expect(attributions.html).to.be.a('string', "attributions.html");
        expect(attributions.url).to.be.a('string', "attributions.url");
        expect(attributions.text).to.equal("mocked attributions", "attributions.text");
      });

    });

    it('never returns after the get_attributions call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      return never_returns_if_canceled(mobilitybox.get_attributions());
    });
  });

  describe('find_stations_by_name()', ()=>{
    it('calls the correct search_by_name api endpoint', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const query_parameters = { query: "hbf" };

      const expected_result = [
          {
            "name": "Duisburg Hbf",
            "id": "vesputi:station:OW%2F67E4OIaGwDh9unt3wdUxCpyQwy1Qe77N3yRjaWTU",
            "position": {
              "latitude": 51.430453,
              "longitude": 6.774528
            }
          }
      ];

      mock('/stations/search_by_name.json', expected_result, query_parameters);

      return mobilitybox.find_stations_by_name(query_parameters).then((stations)=>{
        expect(stations[0].name).to.be.a('string', "Duisburg Hbf");
      });

    });

    it('calls the correct search_by_name api endpoint with location', ()=>{
      const mobilitybox = new Mobilitybox('abc');

      const query_parameter_with_location = {
        query: "hbf",
        longitude: 11.984178293741593,
        latitude: 51.4783408027985
      };

      const expected_result = [
          {
            "name": "Duisburg Hbf",
            "id": "vesputi:station:OW%2F67E4OIaGwDh9unt3wdUxCpyQwy1Qe77N3yRjaWTU",
            "position": {
              "latitude": 51.430453,
              "longitude": 6.774528
            }
          }
      ];

      mock('/stations/search_by_name.json', expected_result, query_parameter_with_location);

      return mobilitybox.find_stations_by_name(query_parameter_with_location).then((stations)=>{
        expect(stations[0].name).to.be.a('string', "Duisburg Hbf");
      });

    });

    it('never returns after the call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      return never_returns_if_canceled(mobilitybox.find_stations_by_name("foobar"));
    })

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const query_parameters = { query: "hbf" };
      const expected_result = [
          {
            "name": "Duisburg Hbf",
            "id": "vesputi:station:OW%2F67E4OIaGwDh9unt3wdUxCpyQwy1Qe77N3yRjaWTU",
            "position": {
              "latitude": 51.430453,
              "longitude": 6.774528
            }
          }
      ];

      mock('/stations/search_by_name.json', expected_result, query_parameters, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});
      return mobilitybox.find_stations_by_name(query_parameters).then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });

  describe('find_stations_by_position()', ()=>{
    it('calls the correct search_by_position api endpoint', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const query_parameters = { latitude: 12.345, longitude: 23.456 };

      const expected_result = [{"name": "Hogsmead"}];

      mock('/stations/search_by_position.json', expected_result, query_parameters);

      return mobilitybox.find_stations_by_position(query_parameters).then((stations)=>{
        expect(stations[0].name).to.equal("Hogsmead");
      });

    });

    it('never returns after the call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      return never_returns_if_canceled(mobilitybox.find_stations_by_position({}));
    });

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const query_parameters = { latitude: 12.345, longitude: 23.456 };

      const expected_result = [{"name": "Hogsmead"}];

      mock('/stations/search_by_position.json', expected_result, query_parameters, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});

      return mobilitybox.find_stations_by_position(query_parameters).then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });

  describe('find_stations_by_id()', ()=>{
    it('calls the correct search_by_id api endpoint', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const query_parameters = { query: "vesputi:station:foobar", id_type: "mobilitybox" };

      const expected_result = {"name": "Hogsmead"};

      mock('/stations/search_by_id.json', expected_result, query_parameters);

      return mobilitybox.find_stations_by_id({id: "vesputi:station:foobar"}).then((station)=>{
        console.log(station)
        expect(station.name).to.equal("Hogsmead");
      });

    });

    it('calls the correct search_by_id api endpoint if searched for an other id', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const query_parameters = { query: "de:foo:bar", id_type: "dhid" };

      const expected_result = {"name": "Hogsmead"};

      mock('/stations/search_by_id.json', expected_result, query_parameters);

      return mobilitybox.find_stations_by_id({id: "de:foo:bar", id_type: "dhid"}).then((station)=>{
        expect(station.name).to.equal("Hogsmead");
      });

    });

    it('never returns after the call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
        return never_returns_if_canceled(mobilitybox.find_stations_by_id({id: "Huch"}));
    });

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const query_parameters = { query: "de:foo:bar", id_type: "dhid" };
      const expected_result = {"name": "Hogsmead"};

      mock('/stations/search_by_id.json', expected_result, query_parameters, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});

      return mobilitybox.find_stations_by_id({id: "de:foo:bar", id_type: "dhid"}).then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });

  describe('build_station()', ()=>{
    it('can create a MobilityboxStation by its data not from API', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      var station = mobilitybox.build_station({
        name: "a_station_name",
        id: "a_station_id",
        position: {
          latitude: 1.2345,
          longitude: 1.2345
        }
      })

      expect(station.name).to.equal("a_station_name");
      expect(station.id).to.equal("a_station_id");
      expect(station.position.latitude).to.equal(1.2345);
      expect(station.position.longitude).to.equal(1.2345);
      expect(station.mobilitybox).to.equal(mobilitybox);
    });
  });

  describe('get_trip()', ()=>{
    it('calls the correct trip api endpoint', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip_id = "vesputi:trip:foobar";

      const expected_result = {"id": "vesputi:trip:foobar", stops: [{station:{name: "Hogsmead"}}]};

      mock('/trips/'+trip_id+'.json', expected_result);

      return mobilitybox.get_trip({id: trip_id}).then((trip)=>{
        expect(trip.stops[0].station.name).to.equal("Hogsmead");
      });

    });

    it('never returns after the call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      return never_returns_if_canceled(mobilitybox.get_trip({id: "foo"}));
    })

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const trip_id = "vesputi:trip:foobar";
      const expected_result = {"id": "vesputi:trip:foobar", stops: [{station:{name: "Hogsmead"}}]};

      mock('/trips/'+trip_id+'.json', expected_result, null, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});

      return mobilitybox.get_trip({id: trip_id}).then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });

  describe('find_trip_by_characteristics()', ()=>{
    let mobilitybox = new Mobilitybox('abc');
    let origins_from_station = "vesputi:station:1234";
    let mb_origins_from_station = new MobilityboxStation({id: "vesputi:station:1234", name: "Hogsmead Start"}, mobilitybox);
    let destination_station = "vesputi:station:5678";
    let mb_destination_station = new MobilityboxStation({id: "vesputi:station:5678", name: "Hogsmead End"}, mobilitybox);
    let origins_from_departure_time = Date.now();
    let mb_origins_from_departure_time = new MobilityboxEventTime({scheduled_at: Date.now()}, mobilitybox);
    let destination_arrival_time = Date.now();
    let mb_destination_arrival_time = new MobilityboxEventTime({scheduled_at: Date.now()}, mobilitybox);
    let line_name = "lorem";

    it('calls the correct search trip api endpoint with string parameters', ()=>{
      const query_parameters = {origins_from_station_id: origins_from_station, destination_station_id: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time, line_name: line_name};
      const parameters = {origins_from_station: origins_from_station, destination_station: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time, line_name: line_name};
      const expected_result = {"id": "vesputi:trip:foobar", name: line_name, stops: [{station:{id: origins_from_station, name: "Hogsmead Start"}}, {station:{id: destination_station, name: "Hogsmead End"}}]};

      mock('/trips/search_by_characteristics.json', expected_result, query_parameters);
      return mobilitybox.find_trip_by_characteristics(parameters).then((trip)=>{
        expect(trip.stops[0].station.name).to.equal("Hogsmead Start");
      });
    });

    it('calls the correct search trip api endpoint with mobilitybox model parameters', ()=>{
      const query_parameters = {origins_from_station_id: mb_origins_from_station.id, destination_station_id: mb_destination_station.id, origins_from_departure_time: mb_origins_from_departure_time.scheduled_at.getTime(), destination_arrival_time: mb_destination_arrival_time.scheduled_at.getTime(), line_name: line_name};
      const expected_result = {"id": "vesputi:trip:foobar", name: line_name, stops: [{station:{id: mb_origins_from_station.id, name: mb_origins_from_station.name}}, {station:{id: mb_destination_station.id, name: mb_destination_station.name}}]};
      mock('/trips/search_by_characteristics.json', expected_result, query_parameters);
      return mobilitybox.find_trip_by_characteristics({origins_from_station: mb_origins_from_station, destination_station: mb_destination_station, origins_from_departure_time: mb_origins_from_departure_time, destination_arrival_time: mb_destination_arrival_time, line_name: line_name}).then((trip)=>{
        expect(trip.stops[0].station.name).to.equal("Hogsmead Start");
      });
    });

    it('calls the correct search trip api endpoint even without line_name', ()=>{
      const query_parameters = {origins_from_station_id: origins_from_station, destination_station_id: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time};
      const parameters = {origins_from_station: origins_from_station, destination_station: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time};
      const expected_result = {"id": "vesputi:trip:foobar", name: "first found trip", stops: [{station:{id: origins_from_station, name: "Hogsmead Start"}}, {station:{id: destination_station, name: "Hogsmead End"}}]};

      mock('/trips/search_by_characteristics.json', expected_result, query_parameters);
      return mobilitybox.find_trip_by_characteristics(parameters).then((trip)=>{
        expect(trip.stops[0].station.name).to.equal("Hogsmead Start");
      });
    });

    it('never returns after the call got canceled', ()=>{
      return never_returns_if_canceled(mobilitybox.find_trip_by_characteristics({origins_from_station: origins_from_station, destination_station: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time, line_name: line_name}));
    });

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const query_parameters = {origins_from_station_id: origins_from_station, destination_station_id: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time, line_name: line_name};
      const parameters = {origins_from_station: origins_from_station, destination_station: destination_station, origins_from_departure_time: origins_from_departure_time, destination_arrival_time: destination_arrival_time, line_name: line_name};
      const expected_result = {"id": "vesputi:trip:foobar", name: line_name, stops: [{station:{id: origins_from_station, name: "Hogsmead Start"}}, {station:{id: destination_station, name: "Hogsmead End"}}]};

      mock('/trips/search_by_characteristics.json', expected_result, query_parameters, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});
      return mobilitybox.find_trip_by_characteristics(parameters).then((trip)=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });

  describe('vector_tile_source()', ()=>{
    it('returns a Mapbox compatible version of the vector tiles, including its source url', ()=>{
      const mobilitybox = new Mobilitybox('abc')
      const tile_source = mobilitybox.vector_tile_source()

      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/station_map/{z}-{x}-{y}.mvt?api_key='+mobilitybox.access_token)
      expect(tile_source.type).to.equal('vector')
    })
    it('transmits the api key to the endpoint')
  })

  describe('station_map_vector_tile_source()', ()=>{
    it('returns a Mapbox compatible version of the vector tiles, including its source url', ()=>{
      const mobilitybox = new Mobilitybox('abc')
      const tile_source = mobilitybox.station_map_vector_tile_source()

      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/station_map/{z}-{x}-{y}.mvt?api_key='+mobilitybox.access_token)
      expect(tile_source.type).to.equal('vector')
    })
    it('transmits the api key to the endpoint', ()=>{
      const api_key = uuidv4();
      const mobilitybox = new Mobilitybox(api_key)

      const tile_source = mobilitybox.vector_tile_source()
      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/station_map/{z}-{x}-{y}.mvt?api_key='+api_key)
    });

    it('transmits no api key to the endpoint when no one is given', ()=>{
      const mobilitybox = new Mobilitybox()

      const tile_source = mobilitybox.vector_tile_source()
      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/station_map/{z}-{x}-{y}.mvt?')
    })
  })

  describe('relevant_routes_vector_tile_source()', ()=>{
    it('returns a Mapbox compatible version of the vector tiles of relevant routes, including its source url', ()=>{
      const mobilitybox = new Mobilitybox('abc')
      const tile_source = mobilitybox.relevant_routes_vector_tile_source()

      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/transit_map/{z}-{x}-{y}.mvt?api_key='+mobilitybox.access_token)
      expect(tile_source.type).to.equal('vector')
    })
    it('transmits the api key to the endpoint')
  })

  describe('transit_map_vector_tile_source()', ()=>{
    it('returns a Mapbox compatible version of the vector tiles of the transit map, including its source url', ()=>{
      const mobilitybox = new Mobilitybox('abc')
      const tile_source = mobilitybox.transit_map_vector_tile_source()

      expect(tile_source.tiles[0]).to.equal('https://api.themobilitybox.com/v1/transit_map/{z}-{x}-{y}.mvt?api_key='+mobilitybox.access_token)
      expect(tile_source.type).to.equal('vector')
    })
    it('transmits the api key to the endpoint')
  })
});


describe('MobilityboxStation', ()=>{
  describe('attributes',()=>{
    it('has all expected attributes',()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = new MobilityboxStation({
        id: "some_id",
        name: "some_name",
        position: {
          latitude: 1.234,
          longitude: 2.345
        },
      }, mobilitybox);

      expect(station.name, 'name').to.equal("some_name")
      expect(station.id, 'id').to.equal("some_id")
      expect(station.mobilitybox, 'mobilitybox').to.equal(mobilitybox)
      expect(station.position, 'position').to.not.be.null
      expect(station.position.latitude, 'latitude').to.equal(1.234)
      expect(station.position.longitude, 'longitude').to.equal(2.345)
    });
    it('creates with position if there is one given',()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = new MobilityboxStation({
        id: "some_id",
        name: "some_name",
        position: {
          latitude: 1.234,
          longitude: 2.345
        }
      }, mobilitybox);

      expect(station.position).to.not.be.null
      expect(station.position.latitude).to.equal(1.234)
      expect(station.position.longitude).to.equal(2.345)
    });
    it('creates without position if there is none given',()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = new MobilityboxStation({
        id: "some_id",
        name: "some_name"
      }, mobilitybox);

      expect(station.position).to.be.null
    });
    it('creates without position if one of latitude/longitude is not given',()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = new MobilityboxStation({
        id: "some_id",
        name: "some_name",
        position: {
          latitude: 1.234
        }
      }, mobilitybox);

      expect(station.position).to.be.null
    });
    it('creates a position on [0, 0]',()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = new MobilityboxStation({
        id: "some_id",
        name: "some_name",
        position: {
          latitude: 0,
          longitude: 0
        }
      }, mobilitybox);

      expect(station.position).to.not.be.null
      expect(station.position.latitude).to.equal(0)
      expect(station.position.longitude).to.equal(0)
    });
  });
  describe('get_next_departures()', ()=>{
    it('calls the correct next_departure api endpoint', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = mobilitybox.build_station({id: "vesputi:station:foobar"});

      const query_parameters = {station_id: "vesputi:station:foobar", time: Date.now(), max_departures: 3}

      const expected_result = [{
        trip: {
          id: "a_trip_id",
          headsign: "hogwarts",
          line_name: "5972",
          type: {
            kind:	'steam_express',
            product: 'Hogwarts Express'
          },
          provider: "Hogwarts Express Railway Authorities"
        },
        departure: {
          scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
          predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
          platform: "9 3/4"
        },
      }];

      mock('/departures.json', expected_result, query_parameters);

      return station.get_next_departures({time: query_parameters.time, max_departures: query_parameters.max_departures}).then((departures)=>{
        expect(departures[0].headsign).to.equal("hogwarts");
        expect(departures.length).to.be.below(query_parameters.max_departures+1);
      });

    });

    it('never returns after the call got canceled', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const station = mobilitybox.build_station({id: "vesputi:station:foobar"});
      return never_returns_if_canceled(station.get_next_departures());
    });

    it('updates session_token with session-token in response header', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.session_token).to.equal(null);

      const session_token = uuidv4();
      const station = mobilitybox.build_station({id: "vesputi:station:foobar"});
      const query_parameters = {station_id: "vesputi:station:foobar", time: Date.now()}
      const expected_result = [{
        trip: {
          id: "a_trip_id",
          headsign: "hogwarts",
          line_name: "5972",
          type: {
            kind:	'steam_express',
            product: 'Hogwarts Express'
          },
          provider: "Hogwarts Express Railway Authorities"
        },
        departure: {
          scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
          predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
          platform: "9 3/4"
        },
      }];

      mock('/departures.json', expected_result, query_parameters, {'Authorization': 'Bearer abc' }, {'Session-Token': session_token});

      return station.get_next_departures({time: query_parameters.time}).then(()=>{
        expect(mobilitybox.session_token).to.equal(session_token);
      });
    });
  });
});

describe('MobilityboxDeparture', ()=>{
  describe('attributes', ()=>{
    it('has the right attributes after initialization', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const departure = new MobilityboxDeparture({
        trip: {
          id: "a_trip_id",
          headsign: "hogwarts",
          line_name: "5972",
          type: {
            kind:	'steam_express',
            product: 'Hogwarts Express'
          },
          provider: "Hogwarts Express Railway Authorities"
        },
        departure: {
          scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
          predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
          platform: "9 3/4"
        },
      }, mobilitybox);

      expect(departure.id).to.equal("a_trip_id");
      expect(departure.headsign).to.equal("hogwarts");
      expect(departure.line_name).to.equal("5972");
      expect(departure.type.kind).to.equal("steam_express");
      expect(departure.provider).to.equal("Hogwarts Express Railway Authorities");
      expect(departure.platform).to.equal("9 3/4");
      expect(departure.mobilitybox).to.equal(mobilitybox);

      expect(departure.departure_time.scheduled_at).to.not.be.undefined;
      expect(departure.departure_time.predicted_at).to.not.be.undefined;
      expect(departure.departure_time.scheduled_at).to.not.be.null;
      expect(departure.departure_time.predicted_at).to.not.be.null;
      expect(departure.departure_time.scheduled_at_formatted()).to.equal("0:23"); //Tests run in Universal Time Coordinated
      expect(departure.departure_time.predicted_at_formatted()).to.equal("0:42"); //Tests run in Universal Time Coordinated

      expect(departure.platform).to.equal("9 3/4");
    });
  });

  it('returns a null if predicted_at is not given',()=>{
    const mobilitybox = new Mobilitybox('abc');
    const departure = new MobilityboxDeparture({
      trip: {
      },
      departure: {
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
      },
    }, mobilitybox);

    expect(departure.departure_time.scheduled_at).to.not.be.undefined;
    expect(departure.departure_time.predicted_at).to.not.be.undefined;
    expect(departure.departure_time.scheduled_at).to.not.be.null;
    expect(departure.departure_time.predicted_at).to.be.null;
    expect(departure.departure_time.scheduled_at_formatted()).to.equal("0:23"); //Tests run in Universal Time Coordinated
    expect(departure.departure_time.predicted_at_formatted()).to.be.null;
  });

  it('returns a null if platform is not given',()=>{
    const mobilitybox = new Mobilitybox('abc');
    const departure = new MobilityboxDeparture({
      trip: {},
      departure: {},
    }, mobilitybox);

    expect(departure.platform).to.be.null;
  });
});

describe('MobilityboxEventTime', ()=>{
  describe('attributes',()=>{
    it('has the right attributes', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
        platform: "1"
      });

      expect(event_time.scheduled_at).to.deep.equal(new Date(1609460622000))//Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
      expect(event_time.predicted_at).to.deep.equal(new Date(1609461743000))//Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
    });

    it('sets attributes appropiatly if not given parameters', ()=>{
      const event_time = new MobilityboxEventTime();

      expect(event_time.scheduled_at).to.be.null;
      expect(event_time.predicted_at).to.be.null;
    });

    it('deals properly with not given parameters', ()=>{
      const event_time = new MobilityboxEventTime({});

      expect(event_time.scheduled_at).to.deep.equal(null)
      expect(event_time.predicted_at).to.deep.equal(null)
    });

    it('handels null predicted_at', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        predicted_at: null,
        platform: "1"
      });

      expect(event_time.scheduled_at).to.deep.equal(new Date(1609460622000))//Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
      expect(event_time.predicted_at).to.be.null;
    })
  });

  describe('scheduled_at_formatted()',()=>{
    it('works if data is set', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        platform: "1"
      });

      expect(event_time.scheduled_at_formatted()).to.equal("0:23") //Tests run in Universal Time Coordinated
    });

    it('returns null if data is not set', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: null,
        platform: "1"
      });

      expect(event_time.scheduled_at_formatted()).to.be.null
    });

    it('returns null if no data is given', ()=>{
      const event_time = new MobilityboxEventTime();

      expect(event_time.scheduled_at_formatted()).to.be.null
    });
  });

  describe('predicted_at_formatted()',()=>{
    it('works if data is set', ()=>{
      const event_time = new MobilityboxEventTime({
        predicted_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        platform: "1"
      });

      expect(event_time.predicted_at_formatted()).to.equal("0:23") //Tests run in Universal Time Coordinated
    });

    it('returns null if data is not set', ()=>{
      const event_time = new MobilityboxEventTime({
        predicted_at: null,
        platform: "1"
      });

      expect(event_time.predicted_at_formatted()).to.be.null
    });

    it('returns null if no data is given', ()=>{
      const event_time = new MobilityboxEventTime();

      expect(event_time.predicted_at_formatted()).to.be.null
    });
  });

  describe('scheduled_at_date_formatted()',()=>{
    it('works if data is set', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: 1609547022000, //Fri Jan 02 2021 01:23:42 GMT+0100 (CET)
        platform: "1"
      });

      expect(event_time.scheduled_at_date_formatted()).to.equal("2.1.2021")//Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
    });

    it('returns null if data is not set', ()=>{
      const event_time = new MobilityboxEventTime({
        scheduled_at: null,
        platform: "1"
      });

      expect(event_time.scheduled_at_date_formatted()).to.be.null
    });

    it('returns null if no data is given', ()=>{
      const event_time = new MobilityboxEventTime();

      expect(event_time.scheduled_at_date_formatted()).to.be.null
    });
  });

  describe('predicted_at_date_formatted()',()=>{
    it('works if data is set', ()=>{
      const event_time = new MobilityboxEventTime({
        predicted_at: 1609547022000, //Fri Jan 02 2021 01:23:42 GMT+0100 (CET)
        platform: "1"
      });

      expect(event_time.predicted_at_date_formatted()).to.equal("2.1.2021")//Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
    });

    it('returns null if data is not set', ()=>{
      const event_time = new MobilityboxEventTime({
        predicted_at: null,
        platform: "1"
      });

      expect(event_time.predicted_at_date_formatted()).to.be.null
    });

    it('returns null if no data is given', ()=>{
      const event_time = new MobilityboxEventTime();

      expect(event_time.predicted_at_date_formatted()).to.be.null
    });
  });
});

describe('MobilityboxTrip', ()=>{
  const short_trip_data = {
    id: "a_trip_id",
    name: "a_trip_name",
    stops: [{
      station: {
        id: "a_station_id",
        name: "Hogsmead Centraal",
        postion: {
          latitude: 12.345,
          longitude: 23.456,
        }
      },
      status: "a_status",
      departure: {
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
        platform: "1"
      },
      arrival: {
        scheduled_at: 1609457022000, //Fri Jan 01 2021 00:23:42 GMT+0100 (CET)
        predicted_at: 1609458143000, //Fri Jan 01 2021 00:42:23 GMT+0100 (CET)
        platform: "1"
      }
    },
    {
      station: {
        id: "an_other_station_id",
        name: "Kings Cross International",
        postion: {
          latitude: 12.345,
          longitude: 23.456,
        }
      },
      status: "a_status",
      departure: {
        scheduled_at: 1609464222000, //Fri Jan 01 2021 02:23:42 GMT+0100 (CET)
        predicted_at: 1609465343000, //Fri Jan 01 2021 02:42:23 GMT+0100 (CET)
        platform: "9 3/4"
      },
      arrival: {
        scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
        predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
        platform: "9 3/4"
      }
    }],
    geojson: {
      type: "MultiLineString",
      coordinates: [
        [[12.345, 23.456], [34.567, 45.678], [12.345, 23.456]]
      ]
    }
  };

  describe('attributes',()=>{
    it('takes the mobilitybox object', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip({}, mobilitybox);

      expect(trip.mobilitybox).to.equal(mobilitybox);
    });
    it('has the right attributes after initialization', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip(short_trip_data, mobilitybox);

      expect(trip.name).to.equal("a_trip_name");
      expect(trip.stops.length).to.equal(2);
      expect(trip.id).to.equal("a_trip_id");
      expect(trip.geojson.type).to.equal("MultiLineString");
      expect(trip.geojson.coordinates.length).to.equal(1);
    });

    it('deals with not given values properly', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip({}, mobilitybox);

      expect(trip.id).to.be.null;
      expect(trip.stops.length).to.equal(0);
      expect(trip.name).to.be.null;
    });
  });

  describe('date_formatted()',()=>{
    it('returns a good trip date', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip(short_trip_data, mobilitybox);

      expect(trip.date_formatted()).to.equal("1.1.2021");
    });

    it('returns both days if trip gets via multiple days', ()=>{
      var long_running_trip = JSON.parse(JSON.stringify(short_trip_data));
      long_running_trip.stops[1].arrival.scheduled_at = 1609565022000; //Sat Jan 02 2021 06:23:42 GMT+0100 (CET)

      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip(long_running_trip, mobilitybox);

      expect(trip.date_formatted()).to.equal("1.1.2021 - 2.1.2021");
    });
  });

  describe('origins_from()',()=>{
    it('returns the correct origin station', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip(short_trip_data, mobilitybox);

      expect(trip.origins_from().name).to.equal("Hogsmead Centraal");
    })
  });

  describe('destination()',()=>{
    it('returns the correct destination station', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const trip = new MobilityboxTrip(short_trip_data, mobilitybox);

      expect(trip.destination().name).to.equal("Kings Cross International");
    })
  });

});

describe('MobilityboxStop', ()=>{
  describe('attributes',()=>{
    it('takes the mobilitybox object', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const stop = new MobilityboxStop({}, mobilitybox);

      expect(stop.mobilitybox).to.equal(mobilitybox);
    });

    it('has all attributes', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const stop = new MobilityboxStop({
        station: {
          id: "a_station_id",
          name: "Hogsmead Centraal",
          postion: {
            latitude: 12.345,
            longitude: 23.456,
          }
        },
        status: "a_status",
        departure: {
          scheduled_at: 1609460622000, //Fri Jan 01 2021 01:23:42 GMT+0100 (CET)
          predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
          platform: "1"
        },
        arrival: {
          scheduled_at: 1609457022000, //Fri Jan 01 2021 00:23:42 GMT+0100 (CET)
          predicted_at: 1609458143000, //Fri Jan 01 2021 00:42:23 GMT+0100 (CET)
          platform: "1"
        }
      }, mobilitybox);

      expect(stop.station.id, "stop.station").to.equal('a_station_id');
      expect(stop.status, "stop.status").to.equal('a_status');
      expect(stop.arrival.predicted_at_formatted(), "stop.arrival").to.equal('23:42'); //Tests run in Universal Time Coordinated
      expect(stop.departure.predicted_at_formatted(), "stop.departure").to.equal('0:42'); //Tests run in Universal Time Coordinated
    })

    it('works with empty data given', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const stop = new MobilityboxStop({}, mobilitybox);

      expect(stop.station, "stop.station").to.be.null;
      expect(stop.status, "stop.status").to.be.null;
      expect(stop.arrival, "stop.arrival").to.be.an('Object');
      expect(stop.departure, "stop.departure").to.be.an('Object');
      expect(stop.departure.predicted_at_formatted(), "stop.departure.predicted_at_formatted").to.be.null;
    })

    it('works without data given', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const stop = new MobilityboxStop(undefined, mobilitybox);

      expect(stop.station, "stop.station").to.be.null;
      expect(stop.status, "stop.status").to.be.null;
      expect(stop.arrival, "stop.arrival").to.be.an('Object');
      expect(stop.departure, "stop.departure").to.be.an('Object');
    })

    it('sets event times but their content is null if not given', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      const stop = new MobilityboxStop({
        departure: {
          predicted_at: 1609461743000, //Fri Jan 01 2021 01:42:23 GMT+0100 (CET)
        },
      }, mobilitybox);

      expect(stop.arrival.predicted_at_formatted(), "stop.arrival.predicted_at").to.be.null;
      expect(stop.arrival.scheduled_at_formatted(), "stop.arrival.scheduled_at").to.be.null;

      expect(stop.departure.predicted_at_formatted(), "stop.departure.predicted_at").to.equal('0:42'); //Tests run in Universal Time Coordinated
      expect(stop.departure.scheduled_at_formatted(), "stop.departure.scheduled_at").to.be.null;
    })
  });
});

describe( 'Integration', ()=>{
  it('runs the integration code', ()=>{
    const mobilitybox_access_token = 'hallo_welt123';
    const mobilitybox = new Mobilitybox(mobilitybox_access_token);
    mobilitybox.get_attributions((attributions)=>{
      console.log('=== Output of Integration Test ===');
      console.log('Attributions: '+attributions.text);
    })

    mobilitybox.find_stations_by_name({ query: "Hamburg-Dammtor" }, (stations)=>{
      var station = stations[0];

      console.log('Next Departures for Station: '+station.name);

      station.get_next_departures((departures)=>{
        departures.map((departure)=>{
          console.log(
            " - ",
            departure.departure_time.scheduled_at_formatted(),
            departure.line_name,
            departure.headsign
          )
        })
      });
    });
  })
});

describe( 'access_token', ()=>{
  it('sends the token to all endpoints')
  it('shows a good warning if a wrong access_token is used')
})


const never_returns_if_canceled = function(promise_to_be_checked){
  const promise = new Promise((resolve, reject)=>{
    const request = promise_to_be_checked
      .then((attributions)=>{
        reject("This shall never be called")
      })
      .catch((attributions)=>{
        reject("This shall never be called")
      });
    expect(request.cancel, "request.cancel").to.be.a('function');
    request.cancel()
    setTimeout(()=>{
      if(request.isCanceled()){
        resolve()
      }else{
        reject()
      }
    },10)
  });

  return promise
}
