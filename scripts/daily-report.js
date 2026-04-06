// Daily Fishing Report — runs via GitHub Actions every morning
// Posts seasonal "What's Biting" data for Utah spots

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const S = {
  0: [ // JAN
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Jigs tipped with mealworms through ice", method:"Ice Fishing", bite:"fair", time:"10am-2pm", notes:"Ice fishing season. 6+ inches of ice near Soldier Creek." },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Tube jigs 1/2-1oz jigged at 80-100ft", method:"Jigging", bite:"good", time:"All day", notes:"Lakers deep in winter. Use electronics." },
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Sow bugs #18-20, midges #22-26", method:"Nymph", bite:"fair", time:"11am-2pm", notes:"Midday midge activity can be good." },
    { spot:"East Canyon Reservoir", species:"Rainbow Trout", biting_on:"PowerBait and worm through ice", method:"Ice Fishing", bite:"fair", time:"Morning", notes:"Check ice conditions." },
    { spot:"Rockport Reservoir", species:"Rainbow Trout", biting_on:"Small jigs tipped with waxworms", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Good ice fishing near Park City." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait orange, small jigs under bobber", method:"Bait", bite:"fair", time:"Midday", notes:"Stocked regularly. Great for kids. Try near the dock." },
    { spot:"Scofield Reservoir", species:"Rainbow Trout", biting_on:"Small jigs and waxworms through ice", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Stocked rainbows under the ice." },
    { spot:"Pineview Reservoir", species:"Yellow Perch", biting_on:"Small jigs with waxworms through ice", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Perch schools move — drill lots of holes." },
    { spot:"Deer Creek Reservoir", species:"Rainbow Trout", biting_on:"Jigs tipped with mealworms through ice", method:"Ice Fishing", bite:"fair", time:"Midday", notes:"Check ice thickness first." },
    { spot:"Willard Bay", species:"Walleye", biting_on:"Blade baits jigged near bottom", method:"Jigging", bite:"fair", time:"Dusk", notes:"Fish the dike area. Slow retrieve near bottom." },
  ],
  1: [ // FEB
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Tube jigs and dead minnows through ice", method:"Ice Fishing", bite:"good", time:"9am-2pm", notes:"Peak ice fishing. Cutts are hungry. Try near inlets." },
    { spot:"Scofield Reservoir", species:"Rainbow Trout", biting_on:"Small spoons and jigs through ice", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Good numbers of stocked rainbows." },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Airplane jigs at 90-120ft", method:"Jigging", bite:"good", time:"All day", notes:"Big fish possible. Work the points." },
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Egg patterns #16, sow bugs #18-22", method:"Nymph", bite:"fair", time:"11am-1pm", notes:"Slow and deep with egg patterns." },
    { spot:"Pineview Reservoir", species:"Yellow Perch", biting_on:"Small jigs with waxworms", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Perch schools — drill lots of holes." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait chartreuse, nightcrawlers on bottom", method:"Bait", bite:"fair", time:"Midday", notes:"Stocked in winter. Fish near the bottom." },
    { spot:"Rockport Reservoir", species:"Rainbow Trout", biting_on:"Small spoons jigged through ice", method:"Ice Fishing", bite:"good", time:"Morning", notes:"Consistent ice fishing near Coalville." },
    { spot:"Mantua Reservoir", species:"Rainbow Trout", biting_on:"PowerBait through ice", method:"Ice Fishing", bite:"fair", time:"Midday", notes:"Small reservoir near Brigham City." },
  ],
  2: [ // MAR
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"BWO parachute #20-24, midges #22-26", method:"Dry Fly", bite:"good", time:"11am-2pm", notes:"Early BWO hatches starting." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"PowerBait and jigs near inlets", method:"Bait", bite:"fair", time:"Midday", notes:"Ice-off approaching. Fish near inlets." },
    { spot:"Flaming Gorge Reservoir", species:"Rainbow Trout", biting_on:"Scud patterns #14-18, San Juan Worm", method:"Nymph", bite:"good", time:"All day", notes:"Green River below dam fishing well." },
    { spot:"Utah Lake", species:"White Bass", biting_on:"Small white jigs and spinners", method:"Lure", bite:"fair", time:"Morning", notes:"White bass run starting." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait rainbow, nightcrawlers on bottom", method:"Bait", bite:"good", time:"Morning", notes:"Spring stocking! Great for families." },
    { spot:"Jordanelle Reservoir", species:"Rainbow Trout", biting_on:"PowerBait and worm combos from shore", method:"Bait", bite:"fair", time:"Morning", notes:"Stocked rainbows near Rock Cliff." },
    { spot:"Diamond Fork River", species:"Brown Trout", biting_on:"Pheasant tail nymphs #18, small midges", method:"Nymph", bite:"fair", time:"Midday", notes:"Early season. Fish slow in pools." },
    { spot:"Quail Creek Reservoir", species:"Rainbow Trout", biting_on:"PowerBait, small spinners from shore", method:"Bait", bite:"good", time:"Morning", notes:"Warm water — first to fish well in spring." },
    { spot:"Sand Hollow Reservoir", species:"Largemouth Bass", biting_on:"Senkos and jigs near rocky shoreline", method:"Lure", bite:"fair", time:"Afternoon", notes:"Bass waking up. Slow presentations." },
  ],
  3: [ // APR
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"BWO #20-24, Skwala stonefly #10-12", method:"Dry Fly", bite:"hot", time:"11am-3pm", notes:"Prime BWO month! Skwalas too." },
    { spot:"Green River (below Flaming Gorge)", species:"Brown Trout", biting_on:"BWO #18-22, scuds #14-18", method:"Nymph", bite:"hot", time:"All day", notes:"World-class tailwater. BWO hatches building." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"PowerBait chartreuse, Mice Tails near inlets", method:"Bait", bite:"good", time:"Morning", notes:"Ice-off! Fish stack at inlets." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait, nightcrawlers, small Rooster Tail spinners", method:"Bait", bite:"hot", time:"Morning & evening", notes:"Spring stocking in full swing. Fish are hungry!" },
    { spot:"Salem Pond", species:"Channel Catfish", biting_on:"Nightcrawlers and stink bait on bottom", method:"Bait", bite:"fair", time:"Evening", notes:"Catfish waking up as water warms." },
    { spot:"Utah Lake", species:"White Bass", biting_on:"White jigs, small crankbaits in tributaries", method:"Lure", bite:"hot", time:"Morning", notes:"White bass spawning run!" },
    { spot:"Jordanelle Reservoir", species:"Rainbow Trout", biting_on:"PowerBait, worms from shore at Rock Cliff", method:"Bait", bite:"good", time:"Morning", notes:"Good shore fishing." },
    { spot:"Deer Creek Reservoir", species:"Rainbow Trout", biting_on:"Worms and PowerBait from shore", method:"Bait", bite:"good", time:"Morning", notes:"Shore fishing near dam productive." },
    { spot:"Payson Lakes", species:"Rainbow Trout", biting_on:"PowerBait, small spinners from shore", method:"Bait", bite:"good", time:"Morning", notes:"Road opening up. Fresh stocking." },
    { spot:"Pelican Lake", species:"Largemouth Bass", biting_on:"Jigs and soft plastics near weed edges", method:"Lure", bite:"good", time:"Afternoon", notes:"Bass pre-spawn feeding." },
    { spot:"Sand Hollow Reservoir", species:"Largemouth Bass", biting_on:"Spinnerbaits, Senkos in shallow bays", method:"Lure", bite:"good", time:"Morning", notes:"Bass on beds. Sight fishing possible." },
    { spot:"Starvation Reservoir", species:"Walleye", biting_on:"Nightcrawlers, jigs near rocky shoreline", method:"Bait", bite:"good", time:"Evening", notes:"Walleye getting active at dusk." },
    { spot:"Logan River", species:"Brown Trout", biting_on:"Stonefly nymphs #12-14, BWO #20", method:"Nymph", bite:"good", time:"Afternoon", notes:"Spring fishing between storms." },
    { spot:"Diamond Fork River", species:"Brown Trout", biting_on:"BWO nymphs #20, Pheasant Tail #18", method:"Nymph", bite:"good", time:"Midday", notes:"Wild browns. Light tippet." },
  ],
  4: [ // MAY
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Caddis #16-18, Golden Stonefly #8-10", method:"Dry Fly", bite:"hot", time:"Evening", notes:"Evening caddis hatches are incredible." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Jake's Spin-a-Lure, Kastmaster from shore", method:"Lure", bite:"hot", time:"Morning", notes:"Best shore fishing of the year." },
    { spot:"Flaming Gorge Reservoir", species:"Smallmouth Bass", biting_on:"Tube jigs and crankbaits on rocky points", method:"Lure", bite:"good", time:"Morning", notes:"Smallmouth moving shallow for spawn." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait, small Rooster Tail spinners", method:"Lure", bite:"good", time:"Morning", notes:"Trout biting well on small spinners." },
    { spot:"Salem Pond", species:"Bluegill", biting_on:"Worms under bobber, small jigs", method:"Bait", bite:"good", time:"Afternoon", notes:"Bluegill moving into shallows. Fun on ultralight." },
    { spot:"Salem Pond", species:"Channel Catfish", biting_on:"Nightcrawlers, chicken liver on bottom", method:"Bait", bite:"good", time:"Evening", notes:"Catfish active as water warms up." },
    { spot:"Pelican Lake", species:"Largemouth Bass", biting_on:"Topwater frogs, buzzbaits in weeds", method:"Lure", bite:"hot", time:"Early morning", notes:"Best bass lake in Utah heating up!" },
    { spot:"Pineview Reservoir", species:"Smallmouth Bass", biting_on:"Ned rigs, drop shots on rock piles", method:"Lure", bite:"good", time:"Morning", notes:"Bass at Cemetery Point." },
    { spot:"Payson Lakes", species:"Rainbow Trout", biting_on:"Worms, PowerBait, small spinners", method:"Bait", bite:"good", time:"Morning", notes:"Beautiful Nebo Loop. Good family spot." },
    { spot:"Diamond Fork River", species:"Brown Trout", biting_on:"Elk Hair Caddis #16, stonefly nymphs", method:"Fly", bite:"good", time:"Evening", notes:"Caddis hatches starting." },
    { spot:"Sand Hollow Reservoir", species:"Largemouth Bass", biting_on:"Senkos, spinnerbaits near brush", method:"Lure", bite:"hot", time:"Morning", notes:"Bass spawning. Sight fishing possible." },
    { spot:"Starvation Reservoir", species:"Walleye", biting_on:"Nightcrawlers on bottom, jigs at dusk", method:"Bait", bite:"good", time:"Evening", notes:"Walleye active at dusk near dam." },
  ],
  5: [ // JUN
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"PMD #16-18, Green Drake #12-14", method:"Dry Fly", bite:"on_fire", time:"Evening", notes:"Green Drake hatch! Fish go crazy." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Pop gear + worm trolling 15-25ft", method:"Trolling", bite:"hot", time:"Morning", notes:"Trolling season." },
    { spot:"Fish Lake", species:"Splake", biting_on:"Silver spoons trolled along drop-offs", method:"Trolling", bite:"good", time:"Morning", notes:"Splake active mornings." },
    { spot:"Pineview Reservoir", species:"Smallmouth Bass", biting_on:"Ned rigs, drop shots on rock piles", method:"Lure", bite:"hot", time:"Morning", notes:"Incredible smallmouth at Cemetery Point." },
    { spot:"Pelican Lake", species:"Largemouth Bass", biting_on:"Topwater frogs, buzzbaits in weeds", method:"Lure", bite:"on_fire", time:"Early morning", notes:"Topwater bite early morning." },
    { spot:"Causey Reservoir", species:"Tiger Trout", biting_on:"Woolly Buggers #10, small Rapalas", method:"Lure", bite:"good", time:"Morning", notes:"Trophy tigers. Float tube heaven." },
    { spot:"Salem Pond", species:"Bluegill", biting_on:"Worms under bobber, small crickets", method:"Bait", bite:"hot", time:"All day", notes:"Bluegill on beds. Non-stop action." },
    { spot:"Salem Pond", species:"Channel Catfish", biting_on:"Chicken liver, hot dogs, nightcrawlers", method:"Bait", bite:"hot", time:"Night", notes:"Summer catfishing is on! Best after dark." },
    { spot:"Salem Pond", species:"Largemouth Bass", biting_on:"Small Senkos, beetle spins near shore", method:"Lure", bite:"good", time:"Morning", notes:"Bass in the shallows. Small lures work." },
    { spot:"Jordanelle Reservoir", species:"Smallmouth Bass", biting_on:"Tubes, crankbaits on rocky points", method:"Lure", bite:"hot", time:"Morning", notes:"Smallmouth feeding hard." },
    { spot:"Sand Hollow Reservoir", species:"Largemouth Bass", biting_on:"Topwater poppers, swim jigs", method:"Lure", bite:"hot", time:"Early morning", notes:"Topwater at dawn." },
    { spot:"Quail Creek Reservoir", species:"Largemouth Bass", biting_on:"Senkos, spinnerbaits, topwater poppers", method:"Lure", bite:"hot", time:"Early morning", notes:"Fish early." },
    { spot:"Joes Valley Reservoir", species:"Splake", biting_on:"Trolled spoons and small Rapalas", method:"Trolling", bite:"good", time:"Morning", notes:"Trophy splake and tiger trout." },
    { spot:"Deer Creek Reservoir", species:"Walleye", biting_on:"Nightcrawler harnesses trolled 15-20ft", method:"Trolling", bite:"good", time:"Evening", notes:"Walleye bite picking up." },
    { spot:"Payson Lakes", species:"Rainbow Trout", biting_on:"Worms, small spinners, dry flies", method:"Bait", bite:"good", time:"Evening", notes:"Great family fishing." },
  ],
  6: [ // JUL
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"PMD #16-18, caddis #18 evening", method:"Dry Fly", bite:"hot", time:"Evening", notes:"PMD spinnerfall at dusk. Magic hour." },
    { spot:"Granddaddy Lake", species:"Brook Trout", biting_on:"Elk Hair Caddis #16, small spinners", method:"Fly", bite:"good", time:"Morning & evening", notes:"4-mile hike. Arctic Grayling possible!" },
    { spot:"Trial Lake", species:"Brook Trout", biting_on:"Mosquito dries #16, small spoons", method:"Fly", bite:"good", time:"Evening", notes:"Mirror Lake Highway lakes fishing well." },
    { spot:"Flaming Gorge Reservoir", species:"Smallmouth Bass", biting_on:"Tubes and crankbaits on rock points", method:"Lure", bite:"hot", time:"Morning", notes:"Peak bass season." },
    { spot:"Boulder Mountain Lakes", species:"Brook Trout", biting_on:"Dry flies, small spinners, worms", method:"Fly", bite:"good", time:"All day", notes:"Dozens of alpine lakes. Adventure fishing." },
    { spot:"Salem Pond", species:"Bluegill", biting_on:"Worms, crickets under small bobber", method:"Bait", bite:"on_fire", time:"All day", notes:"Peak bluegill. Kids catch one every few minutes." },
    { spot:"Salem Pond", species:"Channel Catfish", biting_on:"Stink bait, hot dogs, nightcrawlers", method:"Bait", bite:"hot", time:"Night", notes:"Night fishing for cats. Bring a lawn chair." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Pop gear trolling 20-30ft, Mice Tails", method:"Trolling", bite:"good", time:"Early morning", notes:"Troll early before sun hits." },
    { spot:"Pineview Reservoir", species:"Smallmouth Bass", biting_on:"Drop shots, Ned rigs at Cemetery Point", method:"Lure", bite:"hot", time:"Morning", notes:"Trophy smallmouth potential." },
    { spot:"Payson Lakes", species:"Rainbow Trout", biting_on:"Dry flies #14-18, worms, PowerBait", method:"Fly", bite:"good", time:"Evening", notes:"Evening dry fly fishing is special." },
    { spot:"Joes Valley Reservoir", species:"Splake", biting_on:"Trolled spoons and Rapalas", method:"Trolling", bite:"good", time:"Morning", notes:"Best splake/tiger trout waters." },
  ],
  7: [ // AUG
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Hoppers #10-12, PMD #16-18", method:"Dry Fly", bite:"hot", time:"Afternoon", notes:"Hopper-dropper time!" },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Pop gear trolling 20-30ft deep", method:"Trolling", bite:"good", time:"Early morning", notes:"Fish deeper now. Troll early." },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Downrigger trolling with spoons 60-80ft", method:"Trolling", bite:"good", time:"Morning", notes:"Lakers deep in summer." },
    { spot:"Quail Creek Reservoir", species:"Largemouth Bass", biting_on:"Topwater poppers, plastic worms", method:"Lure", bite:"good", time:"Early morning", notes:"Bass active early and late." },
    { spot:"Minersville Reservoir", species:"Wiper", biting_on:"Crankbaits, swimbaits paralleling dam", method:"Lure", bite:"good", time:"Evening", notes:"Wipers along the dam at dusk." },
    { spot:"Salem Pond", species:"Channel Catfish", biting_on:"Hot dogs, chicken liver, nightcrawlers", method:"Bait", bite:"hot", time:"Night", notes:"Peak catfish season. Night fishing best." },
    { spot:"Salem Pond", species:"Bluegill", biting_on:"Small worms under bobber, tiny jigs", method:"Bait", bite:"good", time:"Morning", notes:"Still catching bluegill near the weeds." },
    { spot:"Payson Lakes", species:"Rainbow Trout", biting_on:"Hopper patterns, worms, small spinners", method:"Fly", bite:"good", time:"Evening", notes:"Escape the heat at 8,000 ft." },
    { spot:"Sand Hollow Reservoir", species:"Largemouth Bass", biting_on:"Deep crankbaits, Carolina rigs", method:"Lure", bite:"good", time:"Early morning", notes:"Fish early or late." },
  ],
  8: [ // SEP
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"BWO #20-22, caddis #18, hoppers #12", method:"Dry Fly", bite:"hot", time:"Midday", notes:"Fall BWOs returning. Browns getting aggressive." },
    { spot:"Green River (below Flaming Gorge)", species:"Brown Trout", biting_on:"Streamers #6-8, BWO #20", method:"Streamer", bite:"hot", time:"Morning", notes:"Fall streamer season! Strip hard." },
    { spot:"Strawberry Reservoir", species:"Kokanee Salmon", biting_on:"Wedding Ring spinners trolled 15ft", method:"Trolling", bite:"good", time:"Morning", notes:"Kokanee staging near Soldier Creek." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait, worms, small Kastmaster spoons", method:"Bait", bite:"good", time:"Morning", notes:"Fall stocking! Trout are back." },
    { spot:"Fish Lake", species:"Lake Trout", biting_on:"Large spoons and jigs in deep water", method:"Trolling", bite:"good", time:"Morning", notes:"Mackinaw moving shallower." },
    { spot:"Huntington Creek", species:"Cutthroat Trout", biting_on:"Small dries #18-20, terrestrials", method:"Dry Fly", bite:"good", time:"Afternoon", notes:"Wild cutthroat in upper reaches." },
    { spot:"Deer Creek Reservoir", species:"Walleye", biting_on:"Jigs and nightcrawler harnesses at dusk", method:"Lure", bite:"good", time:"Evening", notes:"Walleye feeding before winter." },
    { spot:"Panguitch Lake", species:"Rainbow Trout", biting_on:"PowerBait, small spinners from shore", method:"Bait", bite:"good", time:"Morning", notes:"Beautiful fall colors near Bryce Canyon." },
  ],
  9: [ // OCT
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Streamers #6, BWO #20-24, egg patterns", method:"Streamer", bite:"on_fire", time:"All day", notes:"Brown trout spawn! Trophy fish." },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Tube jigs 60-90ft, trolled spoons", method:"Jigging", bite:"hot", time:"All day", notes:"Lakers shallow. Trophy potential." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"PowerBait, worms near Soldier Creek", method:"Bait", bite:"good", time:"Morning", notes:"Fall feeding. Shore fishing productive." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait, worms, Kastmaster spoons", method:"Bait", bite:"hot", time:"Morning", notes:"Fall stocking! Fish are fresh and hungry." },
    { spot:"Diamond Fork River", species:"Brown Trout", biting_on:"Streamers #8, BWO #20-22", method:"Streamer", bite:"good", time:"Morning", notes:"Big browns move up the canyon." },
    { spot:"Logan River", species:"Brown Trout", biting_on:"BWO #20-22, small streamers #10", method:"Fly", bite:"good", time:"Midday", notes:"BWO hatches in the canyon." },
    { spot:"Willard Bay", species:"Walleye", biting_on:"Blade baits, jigs near dike", method:"Lure", bite:"good", time:"Dusk", notes:"Fall walleye near the dike." },
    { spot:"Deer Creek Reservoir", species:"Walleye", biting_on:"Nightcrawler harnesses, jigs at dusk", method:"Bait", bite:"good", time:"Evening", notes:"Walleye aggressive before winter." },
    { spot:"Panguitch Lake", species:"Rainbow Trout", biting_on:"PowerBait, small spoons from shore", method:"Bait", bite:"good", time:"Morning", notes:"Fall colors. Good fishing near dam." },
  ],
  10: [ // NOV
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Egg patterns #16-18, midges #22-26", method:"Nymph", bite:"good", time:"11am-2pm", notes:"Post-spawn browns hungry." },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Tube jigs 70-100ft", method:"Jigging", bite:"good", time:"Midday", notes:"Lakers feeding before ice." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Jigs and worms, last open water", method:"Bait", bite:"fair", time:"Midday", notes:"Last fishing before freeze-up." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait orange, nightcrawlers on bottom", method:"Bait", bite:"good", time:"Midday", notes:"Trout fishing good. Bundle up." },
    { spot:"Willard Bay", species:"Walleye", biting_on:"Blade baits, jigs along rip-rap", method:"Lure", bite:"good", time:"Evening", notes:"Fall walleye near the dike." },
    { spot:"Starvation Reservoir", species:"Walleye", biting_on:"Jigs with minnows, blade baits", method:"Lure", bite:"good", time:"Dusk", notes:"Walleye schooling up." },
  ],
  11: [ // DEC
    { spot:"Provo River (Middle)", species:"Brown Trout", biting_on:"Midges #22-26, egg patterns #16", method:"Nymph", bite:"fair", time:"11am-1pm", notes:"Winter fishing. Short midday window." },
    { spot:"Strawberry Reservoir", species:"Cutthroat Trout", biting_on:"Jigs tipped with mealworms through ice", method:"Ice Fishing", bite:"fair", time:"10am-2pm", notes:"Early ice. Need 4+ inches!" },
    { spot:"Flaming Gorge Reservoir", species:"Lake Trout", biting_on:"Tube jigs at 80-120ft", method:"Jigging", bite:"good", time:"All day", notes:"Open water jigging. Deep and slow." },
    { spot:"East Canyon Reservoir", species:"Rainbow Trout", biting_on:"Jigs and worms through ice", method:"Ice Fishing", bite:"fair", time:"Morning", notes:"First to freeze. Check reports." },
    { spot:"Rockport Reservoir", species:"Rainbow Trout", biting_on:"Small jigs and PowerBait through ice", method:"Ice Fishing", bite:"fair", time:"Midday", notes:"Good ice fishing near Coalville." },
    { spot:"Salem Pond", species:"Rainbow Trout", biting_on:"PowerBait on bottom, small jigs under bobber", method:"Bait", bite:"fair", time:"Midday", notes:"Winter stocking. Fish slow near bottom." },
    { spot:"Scofield Reservoir", species:"Rainbow Trout", biting_on:"Small jigs through ice", method:"Ice Fishing", bite:"fair", time:"Midday", notes:"Early ice forming." },
  ],
};

async function run() {
  console.log('🐟 Stone Creek Fishing — Daily Report');
  console.log('Date:', new Date().toISOString());
  const month = new Date().getMonth();
  const today = new Date().toISOString().split('T')[0];
  const reports = S[month] || [];
  if (!reports.length) { console.log('No data'); return; }
  const { data: spots, error: spotErr } = await supabase.from('spots').select('id, name');
  if (spotErr) { console.error('Error:', spotErr); return; }
  console.log(`Found ${spots.length} spots`);
  const { data: existing } = await supabase.from('biting_reports').select('spot_id, species').eq('reported_at', today);
  const done = new Set((existing || []).map(e => `${e.spot_id}-${e.species}`));
  let posted = 0;
  for (const r of reports) {
    const spot = spots.find(s => s.name.toLowerCase() === r.spot.toLowerCase());
    if (!spot) { console.log(`  ⚠️ Not found: ${r.spot}`); continue; }
    if (done.has(`${spot.id}-${r.species}`)) { console.log(`  ⏭️ Already: ${r.species} at ${r.spot}`); continue; }
    const { error } = await supabase.from('biting_reports').insert({
      user_id: null, spot_id: spot.id, species: r.species, biting_on: r.biting_on,
      method: r.method, bite_rating: r.bite, time_of_day: r.time,
      notes: `📋 ${r.notes} (Auto-report)`, reported_at: today,
    });
    if (error) { console.error(`  ❌ ${r.spot}:`, error.message); }
    else { console.log(`  ✅ ${r.species} at ${r.spot}`); posted++; }
  }
  console.log(`\nDone! Posted ${posted} reports.`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
