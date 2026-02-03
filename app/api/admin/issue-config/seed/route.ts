import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// The existing dictionary from the codebase
const issueDictionary = {
    "precedence_order": ["vendor", "technical", "plumbing", "soft_services"],
    "technical": {
        "ac_breakdown": ["ac", "acs", "air conditioner", "air conditioning", "ac not working", "ac not cooling", "ac cooling issue", "ac breakdown", "ac installed wrong", "ac installed improperly", "ac hook", "ac hooks", "ac cover", "ac top cover", "ac filter", "ac filters", "ac cleaning", "cleaning ac", "temperature", "hot", "too hot", "hvac", "vent", "ventilation", "blower", "ac noise", "ac water leakage", "ac dripping", "cold"],
        "power_outage": ["power", "no power", "power cut", "electricity", "electrical issue", "switch", "switches", "switch board", "switchboard", "switch box", "switch cover", "switch board broken", "switch board popping out", "plug", "plug point", "power plug", "power socket", "socket", "open wiring", "open electrical wiring", "exposed wiring", "rewiring", "rewiring cable", "junction box", "mcb", "db", "electrical wiring", "short circuit", "spark", "sparking", "loose wire", "outage", "blackout"],
        "wifi_down": ["wifi", "wi-fi", "internet", "net", "network", "networking", "lan", "lan cable", "lan issue", "network cable", "network cabling", "data cable", "data wiring", "ethernet", "power and data cables", "power & data cables", "cable", "cables", "cabling", "cable dressing", "cable dressing issue", "cable dressing needs fixing", "cable dressing needs to be done", "raceway", "race ways", "racewace", "patch cord", "idc board", "server room", "hub room", "it room", "lan switch", "network switch", "wire", "wires", "wire bundle", "bundles of wire", "wires popping out", "network not working", "internet not working", "slow internet", "connection"],
        "lighting_issue": ["light", "lights", "lighting", "lamp", "bulb", "tube light", "led", "light not working", "no lighting", "dim light", "flickering light", "light cover", "light cover broken", "ceiling light", "exit sign not on", "emergency light", "dark"],
        "dg_issue": ["dg", "dg room", "generator", "diesel", "diesel tank", "diesel leakage", "backup power", "dg cleaning", "dg doors", "dg doors locked", "smoke detector", "fire extinguisher in dg", "emergency equipment", "rubber mat", "dg not working"]
    },
    "plumbing": {
        "water_leakage": ["leak", "leaks", "leaking", "leakage", "water leakage", "seepage", "water seepage", "drip", "dripping", "water stagnation", "down water leak", "water marks", "pipe leakage", "pipe leaking", "water pipe", "basement seepage", "ceiling leakage", "wall leakage", "overflow", "blocked drain"],
        "no_water_supply": ["no water", "water supply", "water pressure low", "low water pressure", "tap not working", "tap broken", "dry tap", "water not coming", "no water in washroom"],
        "washroom_hygiene": ["washroom", "wash room", "toilet", "wc", "w/c", "bathroom", "restroom", "urinal", "urinal leakage", "flush", "flush not working", "health faucet", "health faucet gun", "handwash dispenser", "soap dispenser", "wash basin", "basin", "janitor box", "sanitary dispenser", "white cement", "washroom cleaning", "bad smell in washroom", "water clogging", "loo"]
    },
    "vendor": {
        "stuck_lift": ["stuck lift", "lift stuck", "people trapped", "lift jammed", "stuck", "trapped"],
        "lift_breakdown": ["lift", "elevator", "lift breakdown", "lift not working", "lift stopped"],
        "fire_alarm": ["fire", "fire alarm", "fire extinguisher", "fire exit", "fire exit door", "fire hazard", "emergency exit", "exit sign", "fire signage", "restricted area sign", "smoke detector", "fire safety", "alarm"],
        "wall_painting": ["paint", "painting", "paint job", "painting badly done", "repaint", "whitewash", "touch up painting", "wall painting", "ceiling painting", "paint chipped", "paint peeling", "paint coming out", "paint marks", "hand prints", "finger prints", "stain on wall", "color mismatch", "wall"]
    },
    "soft_services": {
        "chair_broken": ["chair", "chairs", "broken chair", "damaged chair", "seating", "seat", "wobbly chair", "unstable chair"],
        "desk_alignment": ["desk", "desks", "table", "tables", "training table", "workstation", "workstations", "cupboard", "rack", "wooden box", "furniture", "furniture alignment", "desk alignment", "table wobbling", "drawer issue"],
        "deep_cleaning": ["deep cleaning", "deep clean", "floor cleaning", "tile cleaning", "carpet cleaning", "glass cleaning", "window cleaning", "dusting", "dirty", "stains", "garbage", "waste", "debris", "cockroach", "pest", "odor", "smell", "acid wash", "sanitize", "housekeeping"],
        "cleaning_required": ["clean", "cleaning", "daily cleaning", "regular cleaning", "bins not cleared", "dustbin", "trash", "janitor cupboard", "cleaning not done", "cleaning delay"]
    }
};

// Human-readable names for issue codes
const issueCodeNames: Record<string, string> = {
    ac_breakdown: 'AC Breakdown',
    power_outage: 'Power/Electrical Issue',
    wifi_down: 'Network/WiFi Issue',
    lighting_issue: 'Lighting Issue',
    dg_issue: 'DG/Generator Issue',
    water_leakage: 'Water Leakage',
    no_water_supply: 'No Water Supply',
    washroom_hygiene: 'Washroom Hygiene',
    stuck_lift: 'Stuck Lift (Emergency)',
    lift_breakdown: 'Lift Breakdown',
    fire_alarm: 'Fire/Safety Issue',
    wall_painting: 'Wall Painting',
    chair_broken: 'Broken Chair',
    desk_alignment: 'Desk/Furniture Issue',
    deep_cleaning: 'Deep Cleaning',
    cleaning_required: 'Cleaning Required'
};

// POST: Seed database from the hardcoded dictionary
export async function POST(request: NextRequest) {
    try {
        const results = {
            skill_groups_created: 0,
            categories_created: 0,
            keywords_created: 0,
            errors: [] as string[]
        };

        // Step 1: Get existing skill groups
        const { data: existingSkillGroups, error: sgError } = await supabaseAdmin
            .from('skill_groups')
            .select('id, code, name');

        if (sgError) {
            return NextResponse.json({ error: `Failed to fetch skill groups: ${sgError.message}` }, { status: 500 });
        }

        // Create a map of skill group code -> id
        const skillGroupMap: Record<string, string> = {};
        for (const sg of existingSkillGroups || []) {
            skillGroupMap[sg.code] = sg.id;
        }

        // Step 2: Create missing skill groups if needed
        const requiredSkillGroups = ['technical', 'plumbing', 'vendor', 'soft_services'];
        for (const sgCode of requiredSkillGroups) {
            if (!skillGroupMap[sgCode]) {
                const { data: newSg, error } = await supabaseAdmin
                    .from('skill_groups')
                    .insert({
                        code: sgCode,
                        name: sgCode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        description: `Auto-created skill group for ${sgCode}`
                    })
                    .select()
                    .single();

                if (error) {
                    results.errors.push(`Failed to create skill group ${sgCode}: ${error.message}`);
                } else if (newSg) {
                    skillGroupMap[sgCode] = newSg.id;
                    results.skill_groups_created++;
                }
            }
        }

        // Step 3: Create issue categories and keywords
        for (const skillGroupCode of requiredSkillGroups) {
            const skillGroupId = skillGroupMap[skillGroupCode];
            const issues = (issueDictionary as any)[skillGroupCode];

            if (!issues || !skillGroupId) continue;

            for (const [issueCode, keywords] of Object.entries(issues)) {
                if (!Array.isArray(keywords)) continue;

                // Check if category already exists
                const { data: existingCat } = await supabaseAdmin
                    .from('issue_categories')
                    .select('id')
                    .eq('code', issueCode)
                    .single();

                let categoryId: string;

                if (existingCat) {
                    categoryId = existingCat.id;
                } else {
                    // Create the category
                    const { data: newCat, error: catError } = await supabaseAdmin
                        .from('issue_categories')
                        .insert({
                            code: issueCode,
                            name: issueCodeNames[issueCode] || issueCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            description: `Category for ${issueCode} issues`,
                            skill_group_id: skillGroupId,
                            priority: 0
                        })
                        .select()
                        .single();

                    if (catError) {
                        results.errors.push(`Failed to create category ${issueCode}: ${catError.message}`);
                        continue;
                    }

                    categoryId = newCat.id;
                    results.categories_created++;
                }

                // Insert keywords
                const keywordRecords = keywords.map((kw: string) => ({
                    issue_category_id: categoryId,
                    keyword: kw.toLowerCase().trim(),
                    match_type: 'contains'
                }));

                const { error: kwError } = await supabaseAdmin
                    .from('issue_keywords')
                    .upsert(keywordRecords, {
                        onConflict: 'issue_category_id,keyword',
                        ignoreDuplicates: true
                    });

                if (kwError) {
                    results.errors.push(`Failed to insert keywords for ${issueCode}: ${kwError.message}`);
                } else {
                    results.keywords_created += keywords.length;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully from issueDictionary',
            results
        });

    } catch (error: any) {
        console.error('Error seeding database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Check current seeding status
export async function GET(request: NextRequest) {
    try {
        const { data: categories, error } = await supabaseAdmin
            .from('issue_categories')
            .select('id')
            .limit(1);

        const isSeeded = !error && categories && categories.length > 0;

        return NextResponse.json({
            is_seeded: isSeeded,
            dictionary_categories: Object.keys(issueDictionary.technical).length +
                Object.keys(issueDictionary.plumbing).length +
                Object.keys(issueDictionary.vendor).length +
                Object.keys(issueDictionary.soft_services).length
        });

    } catch (error: any) {
        return NextResponse.json({
            is_seeded: false,
            error: error.message
        });
    }
}
