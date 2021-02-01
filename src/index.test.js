import { Mobilitybox } from './index.js'
import { expect } from 'chai';

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
