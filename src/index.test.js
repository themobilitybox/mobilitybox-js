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

  it('returns proper attributions', ()=>{
    const mobilitybox = new Mobilitybox('abc');

    mock('/attributions.json', {html: "html", url: "foobar", text: "mocked attributions"})

    function get_attributions(){
      return new Promise(resolve => {
        mobilitybox.get_attributions((attributions)=>{
          resolve(attributions);
        });
      });
    };

    return get_attributions().then((attributions)=>{
      expect(attributions.html).to.be.a('string', "attributions.html");
      expect(attributions.url).to.be.a('string', "attributions.url");
      expect(attributions.text).to.eq("mocked attributions", "attributions.text");
    });

  });

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

    const find_stations_by_name = () => (new Promise(resolve =>
      mobilitybox.find_stations_by_name(query_parameters, stations => resolve(stations))
    ));

    return find_stations_by_name().then((stations)=>{
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

    const find_stations_by_name = () => (new Promise(resolve =>
      mobilitybox.find_stations_by_name(query_parameter_with_location, stations => resolve(stations))
    ));

    return find_stations_by_name().then((stations)=>{
      expect(stations[0].name).to.be.a('string', "Duisburg Hbf");
    });

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
