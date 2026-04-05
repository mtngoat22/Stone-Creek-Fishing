// Daily Fishing Report — runs via GitHub Actions every morning
// Posts seasonal "What's Biting" data for Utah spots

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ================================================================
// SEASONAL FISHING DATA — what typically bites when, across Utah
// Based on Utah DWR reports, guide knowledge, and angler patterns
// ================================================================
const SEASONAL_DATA = {
  // Month 0 = January, 11 = December
  0: [ // JANUARY
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Jigs tipped with mealworms through ice", method: "Ice Fishing", bite: "fair", time: "10am-2pm", notes: "Ice fishing season. Look for 6+ inches of ice near Soldier Creek." },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Tube jigs 1/2-1oz jigged at 80-100ft", method: "Jigging", bite: "good", time: "All day", notes: "Lakers stay deep in winter. Use electronics to find structure." },
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Sow bugs #18-20, midges #22-26", method: "Nymph", bite: "fair", time: "11am-2pm", notes: "Slow winter fishing but midday midge activity can be good." },
    { spot: "East Canyon Reservoir", species: "Rainbow Trout", biting_on: "PowerBait and worm through ice", method: "Ice Fishing", bite: "fair", time: "Morning", notes: "Check ice conditions before going out." },
    { spot: "Rockport Reservoir", species: "Rainbow Trout", biting_on: "Small jigs tipped with waxworms", method: "Ice Fishing", bite: "good", time: "Morning", notes: "Good ice fishing spot close to Park City." },
  ],
  1: [ // FEBRUARY
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Tube jigs and dead minnows through ice", method: "Ice Fishing", bite: "good", time: "9am-2pm", notes: "Peak ice fishing. Cutts are hungry. Try near inlets." },
    { spot: "Scofield Reservoir", species: "Rainbow Trout", biting_on: "Small spoons and jigs through ice", method: "Ice Fishing", bite: "good", time: "Morning", notes: "Good numbers of stocked rainbows under the ice." },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Airplane jigs at 90-120ft", method: "Jigging", bite: "good", time: "All day", notes: "Big fish possible. Work the points and drop-offs." },
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Egg patterns #16, sow bugs #18-22", method: "Nymph", bite: "fair", time: "11am-1pm", notes: "Late-season spawner eggs in the drift. Slow and deep." },
    { spot: "Pineview Reservoir", species: "Yellow Perch", biting_on: "Small jigs with waxworms", method: "Ice Fishing", bite: "good", time: "Morning", notes: "Perch schools move around — drill lots of holes." },
  ],
  2: [ // MARCH
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "BWO parachute #20-24, midges #22-26", method: "Dry Fly", bite: "good", time: "11am-2pm", notes: "Early BWO hatches starting. Best on overcast days." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Jigs and PowerBait near inlets", method: "Bait", bite: "fair", time: "Midday", notes: "Ice-off approaching. Fish near tributary inlets." },
    { spot: "Flaming Gorge Reservoir", species: "Rainbow Trout", biting_on: "Scud patterns #14-18, San Juan Worm", method: "Nymph", bite: "good", time: "All day", notes: "Green River below dam fishing well on scuds." },
    { spot: "Utah Lake", species: "White Bass", biting_on: "Small white jigs and spinners", method: "Lure", bite: "fair", time: "Morning", notes: "White bass run starting. Check tributaries." },
    { spot: "Jordanelle Reservoir", species: "Rainbow Trout", biting_on: "PowerBait and worm combos from shore", method: "Bait", bite: "fair", time: "Morning", notes: "Stocked rainbows near the dam and Rock Cliff areas." },
  ],
  3: [ // APRIL
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "BWO #20-24, Skwala stonefly #10-12", method: "Dry Fly", bite: "hot", time: "11am-3pm", notes: "Prime BWO month! Skwalas showing up. Amazing dry fly fishing." },
    { spot: "Green River (below Flaming Gorge)", species: "Brown Trout", biting_on: "BWO #18-22, scuds #14-18", method: "Nymph", bite: "hot", time: "All day", notes: "World-class tailwater fishing. BWO hatches building." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "PowerBait chartreuse, Mice Tails near inlets", method: "Bait", bite: "good", time: "Morning", notes: "Ice-off! Fish stack up near tributary inlets." },
    { spot: "Diamond Fork River", species: "Brown Trout", biting_on: "BWO nymphs #20, Pheasant Tail #18", method: "Nymph", bite: "good", time: "Midday", notes: "Small stream with wild browns. Light tippet essential." },
    { spot: "Logan River", species: "Brown Trout", biting_on: "Stonefly nymphs #12-14, BWO #20", method: "Nymph", bite: "good", time: "Afternoon", notes: "Spring runoff starting but fishable between storms." },
  ],
  4: [ // MAY
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Caddis #16-18, Golden Stonefly #8-10", method: "Dry Fly", bite: "hot", time: "Evening", notes: "Caddis hatches in the evening are incredible. Swing soft hackles." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Jake's Spin-a-Lure, Kastmaster from shore", method: "Lure", bite: "hot", time: "Morning", notes: "Best shore fishing of the year. Inlets and marina area." },
    { spot: "Flaming Gorge Reservoir", species: "Smallmouth Bass", biting_on: "Tube jigs and crankbaits on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Smallmouth moving shallow for spawn. Great action." },
    { spot: "Starvation Reservoir", species: "Walleye", biting_on: "Nightcrawlers on bottom, jigs at dusk", method: "Bait", bite: "good", time: "Evening", notes: "Walleye active at dusk. Try rocky shoreline near dam." },
    { spot: "Sand Hollow Reservoir", species: "Largemouth Bass", biting_on: "Senkos, spinnerbaits near brush", method: "Lure", bite: "hot", time: "Morning", notes: "Bass spawning in shallow bays. Sight fishing possible." },
  ],
  5: [ // JUNE
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "PMD #16-18, Green Drake #12-14", method: "Dry Fly", bite: "on_fire", time: "Evening", notes: "Green Drake hatch! Biggest dries of the year. Fish go crazy." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Pop gear + worm trolling 15-25ft", method: "Trolling", bite: "hot", time: "Morning", notes: "Trolling season. Pop gear with worm or Mice Tail behind." },
    { spot: "Fish Lake", species: "Splake", biting_on: "Silver spoons trolled along drop-offs", method: "Trolling", bite: "good", time: "Morning", notes: "Splake active in the mornings. Troll along the west shore." },
    { spot: "Pineview Reservoir", species: "Smallmouth Bass", biting_on: "Ned rigs, drop shots on rock piles", method: "Lure", bite: "hot", time: "Morning", notes: "Incredible smallmouth fishing. Try Cemetery Point." },
    { spot: "Pelican Lake", species: "Largemouth Bass", biting_on: "Topwater frogs, buzzbaits in weeds", method: "Lure", bite: "on_fire", time: "Early morning", notes: "Best bass lake in Utah. Topwater bite early morning." },
    { spot: "Causey Reservoir", species: "Tiger Trout", biting_on: "Woolly Buggers #10, small Rapalas", method: "Lure", bite: "good", time: "Morning", notes: "Trophy tiger trout. No motors allowed. Float tube heaven." },
  ],
  6: [ // JULY
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "PMD #16-18, caddis #18 evening", method: "Dry Fly", bite: "hot", time: "Evening", notes: "PMD spinnerfall at dusk. Size 16-18 dries. Magic hour." },
    { spot: "Granddaddy Lake", species: "Brook Trout", biting_on: "Elk Hair Caddis #16, small spinners", method: "Fly", bite: "good", time: "Morning & evening", notes: "Alpine lake, 4-mile hike. Arctic Grayling possible too!" },
    { spot: "Trial Lake", species: "Brook Trout", biting_on: "Mosquito dries #16, small spoons", method: "Fly", bite: "good", time: "Evening", notes: "Mirror Lake Highway lakes all fishing well now." },
    { spot: "Flaming Gorge Reservoir", species: "Smallmouth Bass", biting_on: "Tubes and crankbaits on rock points", method: "Lure", bite: "hot", time: "Morning", notes: "Peak bass season. Antelope Flat and Sheep Creek areas." },
    { spot: "Boulder Mountain Lakes", species: "Brook Trout", biting_on: "Dry flies, small spinners, worms", method: "Fly", bite: "good", time: "All day", notes: "Dozens of alpine lakes. Many lightly fished. Adventure fishing." },
    { spot: "Joes Valley Reservoir", species: "Splake", biting_on: "Trolled spoons and Rapalas", method: "Trolling", bite: "good", time: "Morning", notes: "One of Utah's best splake/tiger trout waters." },
  ],
  7: [ // AUGUST
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Hoppers #10-12, PMD #16-18, Yellow Sally", method: "Dry Fly", bite: "hot", time: "Afternoon", notes: "Hopper-dropper time! Big foam hoppers with a nymph below." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Pop gear trolling 20-30ft deep", method: "Trolling", bite: "good", time: "Early morning", notes: "Fish are deeper now. Troll early before sun gets high." },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Downrigger trolling with spoons 60-80ft", method: "Trolling", bite: "good", time: "Morning", notes: "Lakers go deep in summer. Downriggers or deep jigs." },
    { spot: "Quail Creek Reservoir", species: "Largemouth Bass", biting_on: "Topwater poppers, plastic worms", method: "Lure", bite: "good", time: "Early morning", notes: "Warm water year-round. Bass active early and late." },
    { spot: "Minersville Reservoir", species: "Wiper", biting_on: "Crankbaits, swimbaits paralleling dam", method: "Lure", bite: "good", time: "Evening", notes: "Wipers run along the dam face at dusk. Fast action." },
  ],
  8: [ // SEPTEMBER
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "BWO #20-22, caddis #18, hoppers #12", method: "Dry Fly", bite: "hot", time: "Midday", notes: "Fall BWOs returning. Browns getting aggressive pre-spawn." },
    { spot: "Green River (below Flaming Gorge)", species: "Brown Trout", biting_on: "Streamers #6-8, BWO #20", method: "Streamer", bite: "hot", time: "Morning", notes: "Fall streamer season! Big browns chasing meat. Strip hard." },
    { spot: "Strawberry Reservoir", species: "Kokanee Salmon", biting_on: "Wedding Ring spinners trolled 15ft", method: "Trolling", bite: "good", time: "Morning", notes: "Kokanee staging for fall run. Best near Soldier Creek." },
    { spot: "Fish Lake", species: "Lake Trout", biting_on: "Large spoons and jigs in deep water", method: "Trolling", bite: "good", time: "Morning", notes: "Mackinaw moving shallower as water cools." },
    { spot: "Huntington Creek", species: "Cutthroat Trout", biting_on: "Small dries #18-20, terrestrials", method: "Dry Fly", bite: "good", time: "Afternoon", notes: "Beautiful canyon stream. Wild cutthroat in upper reaches." },
  ],
  9: [ // OCTOBER
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Streamers #6, BWO #20-24, egg patterns", method: "Streamer", bite: "on_fire", time: "All day", notes: "Brown trout spawn run! Trophy fish. Streamers in the morning, BWO midday." },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Tube jigs 60-90ft, trolled spoons", method: "Jigging", bite: "hot", time: "All day", notes: "Lakers moving shallower. Trophy potential. Use electronics." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "PowerBait, worms near Soldier Creek inlet", method: "Bait", bite: "good", time: "Morning", notes: "Fall feeding before winter. Shore fishing productive again." },
    { spot: "Panguitch Lake", species: "Rainbow Trout", biting_on: "PowerBait, small spoons from shore", method: "Bait", bite: "good", time: "Morning", notes: "Beautiful fall colors. Good trout fishing near the dam." },
    { spot: "Deer Creek Reservoir", species: "Walleye", biting_on: "Nightcrawler harnesses, jigs at dusk", method: "Bait", bite: "good", time: "Evening", notes: "Walleye feed aggressively before winter. Try near the dam." },
  ],
  10: [ // NOVEMBER
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Egg patterns #16-18, midges #22-26", method: "Nymph", bite: "good", time: "11am-2pm", notes: "Post-spawn browns hungry. Eggs in the drift. Midges all day." },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Tube jigs 70-100ft", method: "Jigging", bite: "good", time: "Midday", notes: "Lakers feeding heavily before ice. Good numbers." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Jigs and worms, preparing for ice season", method: "Bait", bite: "fair", time: "Midday", notes: "Last open-water fishing before freeze-up." },
    { spot: "Willard Bay", species: "Walleye", biting_on: "Blade baits, jigs along rip-rap", method: "Lure", bite: "good", time: "Evening", notes: "Fall walleye bite near the dike. Blade baits worked slow." },
    { spot: "Starvation Reservoir", species: "Walleye", biting_on: "Jigs with minnows, blade baits", method: "Lure", bite: "good", time: "Dusk", notes: "Walleye school up in fall. Find them with electronics." },
  ],
  11: [ // DECEMBER
    { spot: "Provo River (Middle)", species: "Brown Trout", biting_on: "Midges #22-26, egg patterns #16", method: "Nymph", bite: "fair", time: "11am-1pm", notes: "Winter fishing. Short window midday. Bundle up." },
    { spot: "Strawberry Reservoir", species: "Cutthroat Trout", biting_on: "Jigs tipped with mealworms through ice", method: "Ice Fishing", bite: "fair", time: "10am-2pm", notes: "Early ice forming. Check thickness — need 4+ inches minimum!" },
    { spot: "Flaming Gorge Reservoir", species: "Lake Trout", biting_on: "Tube jigs at 80-120ft", method: "Jigging", bite: "good", time: "All day", notes: "Open water jigging still productive. Deep and slow." },
    { spot: "East Canyon Reservoir", species: "Rainbow Trout", biting_on: "Jigs and worms through ice", method: "Ice Fishing", bite: "fair", time: "Morning", notes: "One of the first reservoirs to freeze. Check ice reports." },
    { spot: "Rockport Reservoir", species: "Rainbow Trout", biting_on: "Small jigs and PowerBait through ice", method: "Ice Fishing", bite: "fair", time: "Midday", notes: "Good early ice fishing near Coalville." },
  ],
};

async function run() {
  console.log('🐟 Stone Creek Fishing — Daily Report');
  console.log('Date:', new Date().toISOString());

  const month = new Date().getMonth(); // 0-11
  const today = new Date().toISOString().split('T')[0];
  const reports = SEASONAL_DATA[month] || [];

  if (!reports.length) {
    console.log('No data for this month');
    return;
  }

  // Get all spots from database
  const { data: spots, error: spotErr } = await supabase
    .from('spots')
    .select('id, name');

  if (spotErr) {
    console.error('Error loading spots:', spotErr);
    return;
  }

  console.log(`Found ${spots.length} spots in database`);

  // Check what was already posted today
  const { data: existing } = await supabase
    .from('biting_reports')
    .select('spot_id, species')
    .eq('reported_at', today);

  const alreadyPosted = new Set(
    (existing || []).map(e => `${e.spot_id}-${e.species}`)
  );

  let posted = 0;

  for (const report of reports) {
    // Find matching spot in database
    const spot = spots.find(s =>
      s.name.toLowerCase() === report.spot.toLowerCase()
    );

    if (!spot) {
      console.log(`  ⚠️ Spot not found: ${report.spot}`);
      continue;
    }

    // Skip if already posted today
    const key = `${spot.id}-${report.species}`;
    if (alreadyPosted.has(key)) {
      console.log(`  ⏭️ Already posted: ${report.species} at ${report.spot}`);
      continue;
    }

    // Insert biting report (no user_id = system-generated)
    const { error } = await supabase.from('biting_reports').insert({
      user_id: null,
      spot_id: spot.id,
      species: report.species,
      biting_on: report.biting_on,
      method: report.method,
      bite_rating: report.bite,
      time_of_day: report.time,
      notes: `📋 ${report.notes} (Auto-report based on seasonal patterns)`,
      reported_at: today,
    });

    if (error) {
      console.error(`  ❌ Error posting ${report.species} at ${report.spot}:`, error.message);
    } else {
      console.log(`  ✅ Posted: ${report.species} at ${report.spot} — ${report.bite}`);
      posted++;
    }
  }

  console.log(`\nDone! Posted ${posted} reports.`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
