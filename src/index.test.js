import { Mobilitybox } from './index.js'
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
    it('has to be implemented');
  });
  describe('get_next_departures()',()=>{
    it('has to be implemented');
  });
});

describe('MobilityboxDeparture', ()=>{
  describe('attributes',()=>{
    it('has to be implemented');
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
