import { Mobilitybox, MobilityboxStation, MobilityboxDeparture } from './index.js'
import { expect } from 'chai';
import nock from 'nock'

// Configure Axios (http-framework) for getting compatible with nock (mocking http-requests)
import axios from 'axios';
axios.defaults.adapter = require('axios/lib/adapters/http');

function mock(path, return_value, query){
  return nock('https://api.themobilitybox.com')
  .get('/v1'+path)
  .query(query || true)
  .reply(200, return_value)
}

describe('Mobilitybox', ()=>{
  describe('attributes',()=>{
    it('initializes with an api token', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.access_token).to.eq("abc");
    });

    it('can initialize without a base url', ()=>{
      const mobilitybox = new Mobilitybox('abc');
      expect(mobilitybox.base_url).to.eq("https://api.themobilitybox.com/v1");
    });

    it('can initialize with a given base url', ()=>{
      const mobilitybox = new Mobilitybox('abc', 'https://foobar.lol/v42');
      expect(mobilitybox.base_url).to.eq("https://foobar.lol/v42");
    });
  });

  describe('get_attributions()',()=>{
    it('returns proper attributions', ()=>{
      const mobilitybox = new Mobilitybox('abc');

      mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"})

      return mobilitybox.get_attributions().then((attributions)=>{
        expect(attributions.html).to.be.a('string', "attributions.html");
        expect(attributions.url).to.be.a('string', "attributions.url");
        expect(attributions.text).to.eq("mocked attributions", "attributions.text");
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

    it('warns if query is shorter than 3 chars');

    it('never returns after the call got canceled')
  });

  describe('find_stations_by_position()', ()=>{
    it('has to be implemented');
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

      expect(station.name).to.eq("a_station_name");
      expect(station.id).to.eq("a_station_id");
      expect(station.position.latitude).to.eq(1.2345);
      expect(station.position.longitude).to.eq(1.2345);
      expect(station.mobilitybox).to.eq(mobilitybox);
    });
  });

  describe('get_trip()', ()=>{
    it('has to be implemented');
  });
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

      expect(station.name, 'name').to.eq("some_name")
      expect(station.id, 'id').to.eq("some_id")
      expect(station.mobilitybox, 'mobilitybox').to.eq(mobilitybox)
      expect(station.position, 'position').to.not.be.null
      expect(station.position.latitude, 'latitude').to.eq(1.234)
      expect(station.position.longitude, 'longitude').to.eq(2.345)
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
      expect(station.position.latitude).to.eq(1.234)
      expect(station.position.longitude).to.eq(2.345)
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
      expect(station.position.latitude).to.eq(0)
      expect(station.position.longitude).to.eq(0)
    });
  });
  describe('get_next_departures()',()=>{
    it('has to be implemented');
  });
});

describe('MobilityboxDeparture', ()=>{
  describe('attributes', ()=>{
    it('uses a better interface for scheduled and predicted departure time'
      //Do it more flat like
      // expect(departure.scheduled_at).to.not.be.undefined;
      // expect(departure.predicted_at).to.not.be.undefined;
      // expect(departure.scheduled_at).to.not.be.null;
      // expect(departure.predicted_at).to.not.be.null;
    );

    it('can return a date object for further use');
    it('can handle time-zones');


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

      expect(departure.id).to.eq("a_trip_id");
      expect(departure.headsign).to.eq("hogwarts");
      expect(departure.line_name).to.eq("5972");
      expect(departure.type.kind).to.eq("steam_express");
      expect(departure.provider).to.eq("Hogwarts Express Railway Authorities");
      expect(departure.platform).to.eq("9 3/4");
      expect(departure.mobilitybox).to.eq(mobilitybox);

      expect(departure.departure_time.scheduled_at).to.not.be.undefined;
      expect(departure.departure_time.predicted_at).to.not.be.undefined;
      expect(departure.departure_time.scheduled_at).to.not.be.null;
      expect(departure.departure_time.predicted_at).to.not.be.null;
      expect(departure.departure_time.scheduled_at_formated()).to.eq("1:23");
      expect(departure.departure_time.predicted_at_formated()).to.eq("1:42");

      expect(departure.platform).to.eq("9 3/4");
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
    expect(departure.departure_time.scheduled_at_formated()).to.eq("1:23");
    expect(departure.departure_time.predicted_at_formated()).to.eq("");
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
    it('has to be implemented');
  });

  describe('scheduled_at_formated()',()=>{
    it('has to be implemented');
  });

  describe('predicted_at_formated()',()=>{
    it('has to be implemented');
  });

  describe('scheduled_at_date_formated()',()=>{
    it('has to be implemented');
  });
});

describe('MobilityboxTrip', ()=>{
  describe('attributes',()=>{
    it('has to be implemented');
  });

  describe('date_formated()',()=>{
    it('has to be implemented');
  });

  describe('origins_from()',()=>{
    it('has to be implemented');
  });

  describe('destination()',()=>{
    it('has to be implemented');
  });

});

describe('MobilityboxStop', ()=>{
  describe('attributes',()=>{
    it('has to be implemented');
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
            departure.departure_time.scheduled_at_formated(),
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
