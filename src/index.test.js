import { Mobilitybox } from './index.js'
import { expect } from 'chai';
import nock from 'nock'

// Configure Axios (http-framework) for getting compatible with nock (mocking http-requests)
import axios from 'axios';
axios.defaults.adapter = require('axios/lib/adapters/http');

function mock(path, return_value){
  return nock('https://api.themobilitybox.com')
  .get('/v1'+path)
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
});

describe( 'Integration', ()=>{
  it('runs the integration code', ()=>{
    const mobilitybox_access_token = 'hallo_welt123';
    const mobilitybox = new Mobilitybox(mobilitybox_access_token);
    mobilitybox.get_attributions((attributions)=>{
      console.log('=== Output of Integration Test ===');
      console.log('Attributions: '+attributions.text);
    })

    mobilitybox.find_stations_by_name("Hamburg-Dammtor", (stations)=>{
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
