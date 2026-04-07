// Daily Fishing Report — runs via GitHub Actions every morning
// Posts a "What's Biting" report for EVERY spot, every day

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ================================================================
// Per-spot data: what's biting in each month for every Utah spot
// Format: SPOT_DATA[spotName][month 0-11] = {species, biting_on, method, bite, time, notes}
// ================================================================

const FROZEN = (spot) => ({ species: "Ice Conditions", biting_on: "Check ice thickness before going", method: "Ice Fishing", bite: "slow", time: "Midday", notes: "Winter — check local ice reports. Need 4+ inches of clear ice minimum. Alpine access may be limited." });
const SNOWED_IN = (spot) => ({ species: "Seasonal Closure", biting_on: "Access road closed for winter", method: "Closed", bite: "slow", time: "N/A", notes: "Spot is inaccessible due to snow. Check back in late spring when roads open." });

// Default seasonal templates for common spot types
const RIVER_SPRING = { species: "Brown Trout", biting_on: "BWO #20-24, midges #22-26, small nymphs", method: "Nymph", bite: "good", time: "11am-2pm", notes: "Spring BWO hatches. Fish slow and deep between hatches." };
const RIVER_SUMMER = { species: "Brown Trout", biting_on: "Caddis #16-18, hoppers #10-12, PMD #16", method: "Dry Fly", bite: "good", time: "Evening", notes: "Evening dry fly fishing. Hopper-dropper rigs productive." };
const RIVER_FALL = { species: "Brown Trout", biting_on: "BWO #20-22, streamers #6-10, egg patterns", method: "Streamer", bite: "good", time: "Morning", notes: "Fall streamer season. Big browns getting aggressive." };
const RIVER_WINTER = { species: "Brown Trout", biting_on: "Midges #22-26, egg patterns #16-18", method: "Nymph", bite: "fair", time: "11am-1pm", notes: "Winter fishing. Short midday window. Fish deep and slow." };

const LAKE_SPRING = { species: "Rainbow Trout", biting_on: "PowerBait, nightcrawlers, small spinners", method: "Bait", bite: "good", time: "Morning", notes: "Ice-off! Fish near inlets and shoreline." };
const LAKE_SUMMER = { species: "Rainbow Trout", biting_on: "Trolled spoons and pop gear 15-25ft deep", method: "Trolling", bite: "good", time: "Early morning", notes: "Fish deeper as water warms. Troll early." };
const LAKE_FALL = { species: "Rainbow Trout", biting_on: "PowerBait, spoons, nightcrawlers from shore", method: "Bait", bite: "good", time: "Morning", notes: "Fall feeding. Fish near shore as water cools." };
const LAKE_WINTER = { species: "Rainbow Trout", biting_on: "Small jigs and PowerBait through ice", method: "Ice Fishing", bite: "fair", time: "Midday", notes: "Ice fishing season. Check ice thickness before going out." };

const BASS_SPRING = { species: "Largemouth Bass", biting_on: "Senkos, spinnerbaits near shallow structure", method: "Lure", bite: "good", time: "Afternoon", notes: "Pre-spawn bass moving shallow. Slow presentations." };
const BASS_SUMMER = { species: "Largemouth Bass", biting_on: "Topwater poppers, Senkos, crankbaits", method: "Lure", bite: "hot", time: "Early morning", notes: "Topwater bite at dawn. Fish slower during midday heat." };
const BASS_FALL = { species: "Largemouth Bass", biting_on: "Crankbaits, jigs, jerkbaits near structure", method: "Lure", bite: "good", time: "Morning", notes: "Fall feeding frenzy. Bass chase baitfish shallow." };
const BASS_WINTER = { species: "Largemouth Bass", biting_on: "Slow-rolled jigs, jerkbaits in deeper water", method: "Lure", bite: "fair", time: "Midday", notes: "Slow winter bite. Fish deeper and slower." };

// Spot-specific overrides
const SPOT_DATA = {
  "Provo River (Middle)": {
    0: { species: "Brown Trout", biting_on: "Sow bugs #18-20, zebra midges #22-26", method: "Nymph", bite: "fair", time: "11am-2pm", notes: "Winter midge fishing. Slow and deep." },
    1: { species: "Brown Trout", biting_on: "Egg patterns #16, sow bugs #18-22", method: "Nymph", bite: "fair", time: "11am-1pm", notes: "Late-season spawner eggs. Slow winter fishing." },
    2: { species: "Brown Trout", biting_on: "BWO parachute #20-24, midges #22-26", method: "Dry Fly", bite: "good", time: "11am-2pm", notes: "Early BWO hatches starting. Best on overcast days." },
    3: { species: "Brown Trout", biting_on: "BWO #20-24, Skwala stonefly #10-12", method: "Dry Fly", bite: "hot", time: "11am-3pm", notes: "Prime BWO month! Skwalas showing up." },
    4: { species: "Brown Trout", biting_on: "Elk Hair Caddis #16-18, Golden Stonefly #8-10", method: "Dry Fly", bite: "hot", time: "Evening", notes: "Evening caddis hatches are incredible." },
    5: { species: "Brown Trout", biting_on: "Green Drake #12-14, PMD #16-18", method: "Dry Fly", bite: "on_fire", time: "Evening", notes: "Green Drake hatch! Biggest dries of the year." },
    6: { species: "Brown Trout", biting_on: "PMD #16-18, Elk Hair Caddis #18", method: "Dry Fly", bite: "hot", time: "Evening", notes: "PMD spinnerfall at dusk. Magic hour." },
    7: { species: "Brown Trout", biting_on: "Foam hoppers #10-12, PMD #16, Yellow Sally", method: "Dry Fly", bite: "hot", time: "Afternoon", notes: "Hopper-dropper time!" },
    8: { species: "Brown Trout", biting_on: "BWO #20-22, foam hoppers #12", method: "Dry Fly", bite: "hot", time: "Midday", notes: "Fall BWOs returning. Pre-spawn browns aggressive." },
    9: { species: "Brown Trout", biting_on: "Olive streamers #6, BWO #20-24, egg patterns", method: "Streamer", bite: "on_fire", time: "All day", notes: "Brown trout spawn run! Trophy fish." },
    10: { species: "Brown Trout", biting_on: "Egg patterns #16-18, zebra midges #22-26", method: "Nymph", bite: "good", time: "11am-2pm", notes: "Post-spawn browns hungry. Eggs in the drift." },
    11: { species: "Brown Trout", biting_on: "Zebra midges #22-26, egg patterns #16", method: "Nymph", bite: "fair", time: "11am-1pm", notes: "Winter fishing. Short midday window." },
  },
  "Provo River (Lower)": {
    0: RIVER_WINTER, 1: RIVER_WINTER, 2: RIVER_SPRING, 3: RIVER_SPRING,
    4: RIVER_SUMMER, 5: RIVER_SUMMER, 6: RIVER_SUMMER, 7: RIVER_SUMMER,
    8: RIVER_FALL, 9: RIVER_FALL, 10: RIVER_FALL, 11: RIVER_WINTER,
  },
  "Provo River (Upper)": {
    0: RIVER_WINTER, 1: RIVER_WINTER, 2: RIVER_SPRING, 3: RIVER_SPRING,
    4: RIVER_SUMMER, 5: RIVER_SUMMER, 6: RIVER_SUMMER, 7: RIVER_SUMMER,
    8: RIVER_FALL, 9: RIVER_FALL, 10: RIVER_FALL, 11: RIVER_WINTER,
  },
  "Strawberry Reservoir": {
    0: { species: "Cutthroat Trout", biting_on: "Tube jigs tipped with mealworms through ice", method: "Ice Fishing", bite: "good", time: "9am-2pm", notes: "Peak ice fishing. Cutts hungry. Try near Soldier Creek." },
    1: { species: "Cutthroat Trout", biting_on: "Tube jigs and dead minnows through ice", method: "Ice Fishing", bite: "good", time: "9am-2pm", notes: "Peak ice fishing. Fish near inlets." },
    2: { species: "Cutthroat Trout", biting_on: "PowerBait and jigs near inlets", method: "Bait", bite: "fair", time: "Midday", notes: "Ice-off approaching. Fish near tributary inlets." },
    3: { species: "Cutthroat Trout", biting_on: "PowerBait chartreuse, Mice Tails near inlets", method: "Bait", bite: "good", time: "Morning", notes: "Ice-off! Fish stack up at inlets." },
    4: { species: "Cutthroat Trout", biting_on: "Jake's Spin-a-Lure, Kastmaster from shore", method: "Lure", bite: "hot", time: "Morning", notes: "Best shore fishing of the year." },
    5: { species: "Cutthroat Trout", biting_on: "Pop gear + worm trolling 15-25ft", method: "Trolling", bite: "hot", time: "Morning", notes: "Peak trolling season." },
    6: { species: "Cutthroat Trout", biting_on: "Pop gear trolling 20-30ft, Mice Tails", method: "Trolling", bite: "good", time: "Early morning", notes: "Troll early before sun hits." },
    7: { species: "Cutthroat Trout", biting_on: "Pop gear trolling 20-30ft deep", method: "Trolling", bite: "good", time: "Early morning", notes: "Fish deeper now. Troll early." },
    8: { species: "Kokanee Salmon", biting_on: "Wedding Ring spinners trolled 15ft", method: "Trolling", bite: "good", time: "Morning", notes: "Kokanee staging for fall run. Near Soldier Creek." },
    9: { species: "Cutthroat Trout", biting_on: "PowerBait and worms near Soldier Creek inlet", method: "Bait", bite: "good", time: "Morning", notes: "Fall feeding before winter." },
    10: { species: "Cutthroat Trout", biting_on: "Jigs and worms, last open water", method: "Bait", bite: "fair", time: "Midday", notes: "Last open-water fishing before freeze-up." },
    11: { species: "Cutthroat Trout", biting_on: "Tube jigs with mealworms through early ice", method: "Ice Fishing", bite: "fair", time: "10am-2pm", notes: "Early ice. Check thickness — 4+ inches minimum!" },
  },
  "Flaming Gorge Reservoir": {
    0: { species: "Lake Trout", biting_on: "Tube jigs 1/2-1oz at 80-100ft", method: "Jigging", bite: "good", time: "All day", notes: "Lakers deep in winter. Use electronics." },
    1: { species: "Lake Trout", biting_on: "Airplane jigs at 90-120ft", method: "Jigging", bite: "good", time: "All day", notes: "Big fish possible. Work points and drop-offs." },
    2: { species: "Rainbow Trout", biting_on: "Scud patterns #14-18, San Juan Worm", method: "Nymph", bite: "good", time: "All day", notes: "Green River below dam fishing well." },
    3: { species: "Lake Trout", biting_on: "Tube jigs 60-90ft, trolled spoons", method: "Jigging", bite: "good", time: "All day", notes: "Lakers getting active." },
    4: { species: "Smallmouth Bass", biting_on: "Tube jigs and crankbaits on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Smallmouth moving shallow for spawn." },
    5: { species: "Smallmouth Bass", biting_on: "Tube jigs and crankbaits on rock points", method: "Lure", bite: "hot", time: "Morning", notes: "Peak bass season. Antelope Flat area." },
    6: { species: "Smallmouth Bass", biting_on: "Tubes and crankbaits on rock points", method: "Lure", bite: "hot", time: "Morning", notes: "Peak bass. Sheep Creek areas great." },
    7: { species: "Lake Trout", biting_on: "Downrigger trolling with spoons 60-80ft", method: "Trolling", bite: "good", time: "Morning", notes: "Lakers deep in summer. Downriggers work best." },
    8: { species: "Smallmouth Bass", biting_on: "Jerkbaits and tubes on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Fall feeding. Bass chasing baitfish." },
    9: { species: "Lake Trout", biting_on: "Tube jigs 60-90ft, trolled spoons", method: "Jigging", bite: "hot", time: "All day", notes: "Lakers moving shallower. Trophy potential." },
    10: { species: "Lake Trout", biting_on: "Tube jigs 70-100ft", method: "Jigging", bite: "good", time: "Midday", notes: "Lakers feeding before ice." },
    11: { species: "Lake Trout", biting_on: "Tube jigs at 80-120ft", method: "Jigging", bite: "good", time: "All day", notes: "Open water jigging productive." },
  },
  "Green River (below Flaming Gorge)": {
    0: { species: "Brown Trout", biting_on: "Scud patterns #14-18, midges #22-26", method: "Nymph", bite: "fair", time: "Midday", notes: "Winter tailwater fishing. Scuds year-round." },
    1: { species: "Brown Trout", biting_on: "Scud patterns #14-18, San Juan Worm", method: "Nymph", bite: "fair", time: "Midday", notes: "Tailwater stays fishable all winter." },
    2: { species: "Brown Trout", biting_on: "Scuds #14-18, BWO nymphs #20-22", method: "Nymph", bite: "good", time: "Midday", notes: "BWOs starting. Scuds always good." },
    3: { species: "Brown Trout", biting_on: "BWO #18-22, scuds #14-18", method: "Nymph", bite: "hot", time: "All day", notes: "World-class tailwater! BWO hatches building." },
    4: { species: "Brown Trout", biting_on: "Caddis #16, BWO #20, scuds #14-18", method: "Dry Fly", bite: "hot", time: "Afternoon", notes: "Caddis hatches in full swing." },
    5: { species: "Brown Trout", biting_on: "Cicadas #8, PMD #16-18", method: "Dry Fly", bite: "on_fire", time: "Midday", notes: "Cicada hatch! Huge fish on big dries." },
    6: { species: "Brown Trout", biting_on: "PMD #16-18, cicadas #8", method: "Dry Fly", bite: "hot", time: "Morning", notes: "PMDs and late cicadas. Epic dry fly fishing." },
    7: { species: "Brown Trout", biting_on: "Hoppers #10-12, caddis #18", method: "Dry Fly", bite: "hot", time: "Afternoon", notes: "Hopper season. Big foam bugs." },
    8: { species: "Brown Trout", biting_on: "BWO #20, streamers #6-8", method: "Streamer", bite: "hot", time: "Morning", notes: "Fall streamer season starting." },
    9: { species: "Brown Trout", biting_on: "Olive streamers #6-8, BWO #20", method: "Streamer", bite: "hot", time: "Morning", notes: "Fall streamer season! Big browns." },
    10: { species: "Brown Trout", biting_on: "Midges #22-26, egg patterns #16", method: "Nymph", bite: "good", time: "Midday", notes: "Fall nymphing. Midges and eggs." },
    11: { species: "Brown Trout", biting_on: "Scuds #14-18, midges #22-26", method: "Nymph", bite: "fair", time: "Midday", notes: "Winter tailwater. Still fishable." },
  },
  "Salem Pond": {
    0: { species: "Rainbow Trout", biting_on: "PowerBait orange, nightcrawlers on bottom", method: "Bait", bite: "fair", time: "Midday", notes: "Stocked regularly. Fish near the dock. Great for kids." },
    1: { species: "Rainbow Trout", biting_on: "PowerBait chartreuse, nightcrawlers", method: "Bait", bite: "fair", time: "Midday", notes: "Winter stocking. Fish near the bottom." },
    2: { species: "Rainbow Trout", biting_on: "PowerBait rainbow, nightcrawlers on bottom", method: "Bait", bite: "good", time: "Morning", notes: "Spring stocking! Easy bank access." },
    3: { species: "Rainbow Trout", biting_on: "PowerBait, nightcrawlers, Rooster Tail spinners", method: "Bait", bite: "hot", time: "Morning & evening", notes: "Spring stocking in full swing. Fish are hungry!" },
    4: { species: "Bluegill", biting_on: "Worms under bobber, small jigs", method: "Bait", bite: "good", time: "Afternoon", notes: "Bluegill moving into shallows. Fun on ultralight." },
    5: { species: "Bluegill", biting_on: "Worms under bobber, small crickets", method: "Bait", bite: "hot", time: "All day", notes: "Bluegill on beds. Non-stop action." },
    6: { species: "Bluegill", biting_on: "Worms, crickets under small bobber", method: "Bait", bite: "on_fire", time: "All day", notes: "Peak bluegill. Kids catch one every few minutes." },
    7: { species: "Channel Catfish", biting_on: "Hot dogs, chicken liver, nightcrawlers", method: "Bait", bite: "hot", time: "Night", notes: "Peak catfish season. Night fishing is best." },
    8: { species: "Rainbow Trout", biting_on: "PowerBait, worms, small Kastmaster spoons", method: "Bait", bite: "good", time: "Morning", notes: "Fall stocking! Trout are back." },
    9: { species: "Rainbow Trout", biting_on: "PowerBait, worms, Kastmaster spoons", method: "Bait", bite: "hot", time: "Morning", notes: "Fall stocking! Fish are fresh and hungry." },
    10: { species: "Rainbow Trout", biting_on: "PowerBait orange, nightcrawlers on bottom", method: "Bait", bite: "good", time: "Midday", notes: "Trout fishing good. Bundle up and fish midday." },
    11: { species: "Rainbow Trout", biting_on: "PowerBait on bottom, small jigs under bobber", method: "Bait", bite: "fair", time: "Midday", notes: "Winter stocking. Fish slow near the bottom." },
  },
  "Fish Lake": {
    0: { species: "Lake Trout", biting_on: "Tube jigs through ice at 40-60ft", method: "Ice Fishing", bite: "good", time: "All day", notes: "Ice fishing for mackinaw. 8,800 ft elevation — deep ice." },
    1: { species: "Lake Trout", biting_on: "Tube jigs and dead minnows through ice", method: "Ice Fishing", bite: "good", time: "All day", notes: "Peak ice fishing. Big mackinaw possible." },
    2: FROZEN(), 3: FROZEN(),
    4: { species: "Splake", biting_on: "Silver spoons trolled along drop-offs", method: "Trolling", bite: "good", time: "Morning", notes: "Ice-off! Splake active near drop-offs." },
    5: { species: "Splake", biting_on: "Silver spoons trolled along drop-offs", method: "Trolling", bite: "good", time: "Morning", notes: "Splake active mornings. Troll west shore." },
    6: { species: "Splake", biting_on: "Spoons and small Rapalas trolled deep", method: "Trolling", bite: "good", time: "Morning", notes: "Trolling for splake and tigers." },
    7: { species: "Lake Trout", biting_on: "Spoons trolled deep 40-60ft", method: "Trolling", bite: "good", time: "Morning", notes: "Mackinaw deep in summer." },
    8: { species: "Lake Trout", biting_on: "Large spoons and jigs in deep water", method: "Trolling", bite: "good", time: "Morning", notes: "Mackinaw moving shallower as water cools." },
    9: { species: "Splake", biting_on: "Spoons trolled 20-40ft", method: "Trolling", bite: "good", time: "Morning", notes: "Fall feeding before ice up." },
    10: { species: "Rainbow Trout", biting_on: "PowerBait and worms from shore", method: "Bait", bite: "fair", time: "Midday", notes: "Last open water before ice." },
    11: { species: "Lake Trout", biting_on: "Tube jigs through early ice", method: "Ice Fishing", bite: "fair", time: "Midday", notes: "Early ice. Check thickness!" },
  },
  "Pelican Lake": {
    0: FROZEN(), 1: FROZEN(),
    2: BASS_SPRING, 3: { species: "Largemouth Bass", biting_on: "Jigs and soft plastics near weed edges", method: "Lure", bite: "good", time: "Afternoon", notes: "Bass pre-spawn feeding." },
    4: { species: "Bluegill", biting_on: "Worms and small jigs in shallows", method: "Bait", bite: "hot", time: "Morning", notes: "Pelican Lake is famous for HUGE bluegill!" },
    5: { species: "Largemouth Bass", biting_on: "Topwater frogs, buzzbaits in weeds", method: "Lure", bite: "on_fire", time: "Early morning", notes: "Best bass lake in Utah! Topwater frenzy." },
    6: { species: "Bluegill", biting_on: "Wet flies, small jigs, worms", method: "Fly", bite: "hot", time: "Morning", notes: "World-famous bluegill fishing. 10+ inch fish possible!" },
    7: { species: "Largemouth Bass", biting_on: "Weedless frogs, Senkos in heavy cover", method: "Lure", bite: "good", time: "Early morning", notes: "Fish thick weed mats for big bass." },
    8: { species: "Largemouth Bass", biting_on: "Crankbaits and jigs near weed edges", method: "Lure", bite: "good", time: "Morning", notes: "Fall feeding on edges." },
    9: { species: "Largemouth Bass", biting_on: "Jerkbaits and jigs near weed edges", method: "Lure", bite: "good", time: "Midday", notes: "Fall bass. Slower presentations." },
    10: BASS_FALL, 11: FROZEN(),
  },
  "Sand Hollow Reservoir": {
    0: BASS_WINTER, 1: BASS_WINTER, 2: BASS_SPRING,
    3: { species: "Largemouth Bass", biting_on: "Spinnerbaits, Senkos in shallow bays", method: "Lure", bite: "good", time: "Morning", notes: "Bass on beds. Sight fishing possible." },
    4: { species: "Largemouth Bass", biting_on: "Senkos, spinnerbaits near brush", method: "Lure", bite: "hot", time: "Morning", notes: "Bass spawning in shallow bays." },
    5: { species: "Largemouth Bass", biting_on: "Topwater poppers, swim jigs", method: "Lure", bite: "hot", time: "Early morning", notes: "Topwater at dawn. Red rock cliffs make it epic." },
    6: { species: "Largemouth Bass", biting_on: "Topwater poppers, drop shots", method: "Lure", bite: "hot", time: "Early morning", notes: "Summer bass fishing near St. George." },
    7: { species: "Largemouth Bass", biting_on: "Deep crankbaits, Carolina rigs", method: "Lure", bite: "good", time: "Early morning", notes: "Fish early or late. Midday too hot." },
    8: { species: "Largemouth Bass", biting_on: "Crankbaits, jigs near structure", method: "Lure", bite: "good", time: "Morning", notes: "Fall bass moving back shallow." },
    9: BASS_FALL, 10: BASS_FALL,
    11: BASS_WINTER,
  },
  "Quail Creek Reservoir": {
    0: BASS_WINTER, 1: BASS_WINTER,
    2: { species: "Rainbow Trout", biting_on: "PowerBait, small spinners from shore", method: "Bait", bite: "good", time: "Morning", notes: "First to fish well in spring. Warm water." },
    3: BASS_SPRING, 4: BASS_SUMMER,
    5: { species: "Largemouth Bass", biting_on: "Senkos, spinnerbaits, topwater poppers", method: "Lure", bite: "hot", time: "Early morning", notes: "Near Hurricane. Fish early." },
    6: BASS_SUMMER, 7: BASS_SUMMER,
    8: BASS_FALL, 9: BASS_FALL, 10: BASS_FALL, 11: BASS_WINTER,
  },
  "Utah Lake": {
    0: { species: "Walleye", biting_on: "Blade baits jigged near bottom", method: "Jigging", bite: "fair", time: "Evening", notes: "Slow winter bite. Try Lincoln Beach." },
    1: { species: "Walleye", biting_on: "Blade baits and jigging spoons", method: "Jigging", bite: "fair", time: "Dusk", notes: "Late winter walleye." },
    2: { species: "White Bass", biting_on: "Small white jigs and spinners", method: "Lure", bite: "fair", time: "Morning", notes: "White bass run starting." },
    3: { species: "White Bass", biting_on: "White jigs, small crankbaits in tributaries", method: "Lure", bite: "hot", time: "Morning", notes: "White bass spawning run! Check Provo River mouth." },
    4: { species: "White Bass", biting_on: "Small crankbaits, white grubs", method: "Lure", bite: "good", time: "Morning", notes: "White bass still running." },
    5: { species: "Channel Catfish", biting_on: "Nightcrawlers, stink bait from shore", method: "Bait", bite: "good", time: "Night", notes: "Catfish active at night." },
    6: { species: "Channel Catfish", biting_on: "Nightcrawlers, chicken liver near Lincoln Beach", method: "Bait", bite: "good", time: "Night", notes: "Night fishing from shore." },
    7: { species: "Channel Catfish", biting_on: "Cut bait, stink bait from shore", method: "Bait", bite: "good", time: "Night", notes: "Big cats possible at night." },
    8: { species: "Walleye", biting_on: "Nightcrawler harnesses, crankbaits", method: "Trolling", bite: "good", time: "Evening", notes: "Fall walleye bite improving." },
    9: { species: "Walleye", biting_on: "Jigs and blade baits near rocks", method: "Lure", bite: "good", time: "Evening", notes: "Fall walleye feeding." },
    10: { species: "Walleye", biting_on: "Blade baits near rocky shoreline", method: "Lure", bite: "fair", time: "Evening", notes: "Late fall walleye bite." },
    11: { species: "Walleye", biting_on: "Blade baits jigged near bottom", method: "Jigging", bite: "fair", time: "Evening", notes: "Winter walleye. Slow bite." },
  },
  "Willard Bay": {
    0: { species: "Walleye", biting_on: "Blade baits, jigging spoons near dike", method: "Jigging", bite: "fair", time: "Dusk", notes: "Winter walleye near the dike." },
    1: { species: "Walleye", biting_on: "Blade baits near the dike", method: "Jigging", bite: "fair", time: "Dusk", notes: "Slow winter bite." },
    2: { species: "Wiper", biting_on: "Crankbaits, swimbaits", method: "Lure", bite: "fair", time: "Afternoon", notes: "Wipers waking up." },
    3: { species: "Walleye", biting_on: "Jigs with minnows near rip-rap", method: "Jigging", bite: "good", time: "Evening", notes: "Spring walleye feed." },
    4: { species: "Wiper", biting_on: "Crankbaits paralleling the dike", method: "Lure", bite: "good", time: "Evening", notes: "Wipers active. Fast action possible." },
    5: { species: "Wiper", biting_on: "Swimbaits, crankbaits near dike", method: "Lure", bite: "hot", time: "Evening", notes: "Peak wiper season." },
    6: { species: "Channel Catfish", biting_on: "Cut bait, stink bait", method: "Bait", bite: "good", time: "Night", notes: "Big cats at night." },
    7: { species: "Wiper", biting_on: "Crankbaits and jerkbaits", method: "Lure", bite: "good", time: "Evening", notes: "Wipers still active." },
    8: { species: "Walleye", biting_on: "Nightcrawler harnesses, jigs", method: "Trolling", bite: "good", time: "Evening", notes: "Fall walleye feeding up." },
    9: { species: "Walleye", biting_on: "Blade baits, jigs near dike", method: "Lure", bite: "good", time: "Dusk", notes: "Fall walleye bite." },
    10: { species: "Walleye", biting_on: "Blade baits along rip-rap", method: "Lure", bite: "good", time: "Evening", notes: "Blade baits worked slow." },
    11: { species: "Walleye", biting_on: "Blade baits near bottom", method: "Jigging", bite: "fair", time: "Dusk", notes: "Winter walleye slow." },
  },
  "Pineview Reservoir": {
    0: { species: "Yellow Perch", biting_on: "Small jigs with waxworms through ice", method: "Ice Fishing", bite: "good", time: "Morning", notes: "Perch schools move — drill lots of holes." },
    1: { species: "Yellow Perch", biting_on: "Small jigs with waxworms", method: "Ice Fishing", bite: "good", time: "Morning", notes: "Peak perch ice fishing." },
    2: { species: "Smallmouth Bass", biting_on: "Jigs and tubes near rocky areas", method: "Lure", bite: "fair", time: "Afternoon", notes: "Bass waking up. Slow presentations." },
    3: { species: "Smallmouth Bass", biting_on: "Tubes and Ned rigs on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Bass pre-spawn activity." },
    4: { species: "Smallmouth Bass", biting_on: "Ned rigs, drop shots on rock piles", method: "Lure", bite: "good", time: "Morning", notes: "Bass at Cemetery Point." },
    5: { species: "Smallmouth Bass", biting_on: "Ned rigs, drop shots on rock piles", method: "Lure", bite: "hot", time: "Morning", notes: "Incredible smallmouth fishing at Cemetery Point." },
    6: { species: "Smallmouth Bass", biting_on: "Drop shots, Ned rigs at Cemetery Point", method: "Lure", bite: "hot", time: "Morning", notes: "Trophy smallmouth potential." },
    7: { species: "Smallmouth Bass", biting_on: "Drop shots deeper 15-25ft", method: "Lure", bite: "good", time: "Morning", notes: "Fish deeper in summer heat." },
    8: { species: "Smallmouth Bass", biting_on: "Crankbaits and tubes on rocks", method: "Lure", bite: "good", time: "Morning", notes: "Fall bass fishing." },
    9: { species: "Smallmouth Bass", biting_on: "Jerkbaits and jigs on structure", method: "Lure", bite: "good", time: "Midday", notes: "Fall feeding frenzy." },
    10: { species: "Smallmouth Bass", biting_on: "Jigs slowly on structure", method: "Lure", bite: "fair", time: "Midday", notes: "Cooling water, slower bite." },
    11: { species: "Yellow Perch", biting_on: "Small jigs through ice", method: "Ice Fishing", bite: "fair", time: "Midday", notes: "Early ice perch fishing." },
  },
  "Jordanelle Reservoir": {
    0: LAKE_WINTER, 1: LAKE_WINTER,
    2: { species: "Rainbow Trout", biting_on: "PowerBait and worm combos from shore", method: "Bait", bite: "fair", time: "Morning", notes: "Stocked rainbows near Rock Cliff." },
    3: { species: "Rainbow Trout", biting_on: "PowerBait, worms from shore at Rock Cliff", method: "Bait", bite: "good", time: "Morning", notes: "Shore fishing as water warms." },
    4: { species: "Smallmouth Bass", biting_on: "Drop shot, tubes on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Smallmouth getting active." },
    5: { species: "Smallmouth Bass", biting_on: "Tubes, crankbaits on rocky points", method: "Lure", bite: "hot", time: "Morning", notes: "Smallmouth feeding hard." },
    6: { species: "Smallmouth Bass", biting_on: "Tubes, Ned rigs, drop shots", method: "Lure", bite: "hot", time: "Morning", notes: "Peak bass season." },
    7: { species: "Smallmouth Bass", biting_on: "Drop shots with minnow plastics", method: "Lure", bite: "good", time: "Morning", notes: "Bass deeper now." },
    8: { species: "Rainbow Trout", biting_on: "PowerBait, trolling with pop gear", method: "Trolling", bite: "good", time: "Morning", notes: "Fall trout feeding." },
    9: { species: "Smallmouth Bass", biting_on: "Jerkbaits and jigs on structure", method: "Lure", bite: "good", time: "Midday", notes: "Fall bass feeding." },
    10: { species: "Rainbow Trout", biting_on: "PowerBait from shore", method: "Bait", bite: "fair", time: "Morning", notes: "Late fall shore fishing." },
    11: LAKE_WINTER,
  },
  "Deer Creek Reservoir": {
    0: { species: "Rainbow Trout", biting_on: "Jigs tipped with mealworms", method: "Ice Fishing", bite: "fair", time: "Midday", notes: "Ice forming. Check thickness." },
    1: LAKE_WINTER, 2: LAKE_SPRING,
    3: { species: "Rainbow Trout", biting_on: "Worms and PowerBait from shore", method: "Bait", bite: "good", time: "Morning", notes: "Shore fishing near dam productive." },
    4: LAKE_SUMMER, 5: { species: "Walleye", biting_on: "Nightcrawler harnesses trolled 15-20ft", method: "Trolling", bite: "good", time: "Evening", notes: "Walleye bite picking up." },
    6: { species: "Smallmouth Bass", biting_on: "Tubes and drop shots on rocky points", method: "Lure", bite: "good", time: "Morning", notes: "Smallmouth on structure." },
    7: LAKE_SUMMER,
    8: { species: "Walleye", biting_on: "Jigs and nightcrawler harnesses at dusk", method: "Lure", bite: "good", time: "Evening", notes: "Walleye feeding before winter." },
    9: { species: "Walleye", biting_on: "Nightcrawler harnesses, jigs at dusk", method: "Bait", bite: "good", time: "Evening", notes: "Walleye aggressive before winter." },
    10: { species: "Brown Trout", biting_on: "Trolling Rapalas near shore", method: "Trolling", bite: "fair", time: "Morning", notes: "Browns near shore before ice." },
    11: LAKE_WINTER,
  },
  // For all other spots, use auto-generated templates based on name/type
};

// Auto-generate data for any spot not explicitly defined above
function getSpotData(spotName, month, region, waterType) {
  // Check if we have explicit data
  if (SPOT_DATA[spotName] && SPOT_DATA[spotName][month]) {
    return SPOT_DATA[spotName][month];
  }

  // Alpine lakes (Uintas, high elevation) — frozen most of year
  const isAlpine = /uinta|granddaddy|trial|mirror|lofty|washington|christmas|boulder mountain|tony grove|causey|navajo/i.test(spotName) || region === 'Uintas';
  if (isAlpine) {
    if (month >= 0 && month <= 4) return SNOWED_IN();
    if (month === 5) return { species: "Brook Trout", biting_on: "Mosquito dries #16, small spinners", method: "Fly", bite: "good", time: "Morning", notes: "Alpine lake opening up. Access improving." };
    if (month === 6) return { species: "Brook Trout", biting_on: "Elk Hair Caddis #16, small spinners, worms", method: "Fly", bite: "good", time: "Morning & evening", notes: "Peak alpine fishing. Beautiful high country." };
    if (month === 7) return { species: "Brook Trout", biting_on: "Dry flies, small Kastmaster spoons", method: "Fly", bite: "good", time: "Evening", notes: "Summer alpine fishing. Dry flies work great." };
    if (month === 8) return { species: "Brook Trout", biting_on: "Terrestrials, small nymphs, spinners", method: "Fly", bite: "good", time: "Midday", notes: "Fall approaching. Fish feeding hard before winter." };
    if (month === 9) return { species: "Brook Trout", biting_on: "Small nymphs, spinners", method: "Fly", bite: "fair", time: "Midday", notes: "Last chance before snow closes access." };
    return SNOWED_IN();
  }

  // Rivers/creeks
  const isRiver = waterType === 'river' || waterType === 'creek' || /river|creek|fork/i.test(spotName);
  if (isRiver) {
    if (month === 0 || month === 1 || month === 11) return RIVER_WINTER;
    if (month >= 2 && month <= 4) return RIVER_SPRING;
    if (month >= 5 && month <= 7) return RIVER_SUMMER;
    return RIVER_FALL;
  }

  // Bass-heavy waters
  const isBassWater = /sand hollow|quail creek|gunlock|pelican|mantua|newton|pineview|cutler/i.test(spotName);
  if (isBassWater) {
    if (month === 0 || month === 1 || month === 11) return BASS_WINTER;
    if (month >= 2 && month <= 4) return BASS_SPRING;
    if (month >= 5 && month <= 7) return BASS_SUMMER;
    return BASS_FALL;
  }

  // Default: lake/reservoir trout
  if (month === 0 || month === 1 || month === 11) return LAKE_WINTER;
  if (month >= 2 && month <= 4) return LAKE_SPRING;
  if (month >= 5 && month <= 7) return LAKE_SUMMER;
  return LAKE_FALL;
}

async function run() {
  console.log('🐟 Stone Creek Fishing — Daily Report');
  console.log('Date:', new Date().toISOString());
  const month = new Date().getMonth();
  const today = new Date().toISOString().split('T')[0];

  const { data: spots, error: spotErr } = await supabase.from('spots').select('id, name, region, water_type');
  if (spotErr) { console.error('Error:', spotErr); return; }
  console.log(`Found ${spots.length} spots`);

  const { data: existing } = await supabase.from('biting_reports').select('spot_id, species').eq('reported_at', today);
  const done = new Set((existing || []).map(e => `${e.spot_id}-${e.species}`));

  let posted = 0;
  let skipped = 0;

  for (const spot of spots) {
    const data = getSpotData(spot.name, month, spot.region, spot.water_type);
    if (!data) continue;

    const key = `${spot.id}-${data.species}`;
    if (done.has(key)) { skipped++; continue; }

    const { error } = await supabase.from('biting_reports').insert({
      user_id: null, spot_id: spot.id, species: data.species, biting_on: data.biting_on,
      method: data.method, bite_rating: data.bite, time_of_day: data.time,
      notes: `📋 ${data.notes} (Auto-report)`, reported_at: today,
    });

    if (error) { console.error(`  ❌ ${spot.name}:`, error.message); }
    else { console.log(`  ✅ ${spot.name}: ${data.species}`); posted++; }
  }

  console.log(`\nDone! Posted ${posted}, skipped ${skipped} existing.`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
