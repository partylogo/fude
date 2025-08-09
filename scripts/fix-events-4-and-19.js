#!/usr/bin/env node

// Script to regenerate occurrences for events 4 and 19 after fixing date calculations
const EventRepository = require('../database/eventRepository');
const OccurrenceGenerationService = require('../services/occurrenceGenerationService');

async function fixEvents() {
  console.log('Fixing date calculations for events 4 and 19...\n');
  
  const eventRepository = new EventRepository();
  const occurrenceService = new OccurrenceGenerationService();

  try {
    // Get events 4 and 19
    const event4 = await eventRepository.findById(4);
    const event19 = await eventRepository.findById(19);

    if (!event4) {
      console.log('⚠️  Event 4 not found, skipping...');
    } else {
      console.log(`📋 Event 4: ${event4.title} (${event4.type})`);
      console.log(`   Rule: lunar_month=${event4.lunar_month}, lunar_day=${event4.lunar_day}`);
      
      // Clear and regenerate occurrences for event 4
      await occurrenceService.clearOccurrences(4);
      console.log('   ✅ Cleared old occurrences');
      
      // For lunar events, we need to ensure they're handled properly
      if (event4.type === 'deity' && event4.lunar_month && event4.lunar_day) {
        console.log('   📅 Regenerating lunar event occurrences...');
        // Since deity events are not supported in the current generation service,
        // we need to update the event to use the corrected lunar conversion
        const LunarCalendarService = require('../services/lunarCalendarService');
        const solarDates = LunarCalendarService.convertToSolar({
          month: event4.lunar_month,
          day: event4.lunar_day,
          year: 2025,
          isLeap: false
        });
        
        console.log(`   📅 Lunar ${event4.lunar_month}/${event4.lunar_day} converts to: ${solarDates[0]}`);
        
        // Update the event's solar_date
        await eventRepository.update(4, { solar_date: solarDates[0] });
        console.log('   ✅ Updated solar_date with corrected conversion');
      }
    }

    if (!event19) {
      console.log('⚠️  Event 19 not found, skipping...');
    } else {
      console.log(`\n📋 Event 19: ${event19.title} (${event19.type})`);
      console.log(`   Rule: solar_term_name=${event19.solar_term_name}`);
      
      // Clear and regenerate occurrences for event 19
      await occurrenceService.clearOccurrences(19);
      console.log('   ✅ Cleared old occurrences');
      
      if (event19.type === 'solar_term') {
        await occurrenceService.generateOccurrences(event19, { force: true });
        console.log('   ✅ Regenerated solar term occurrences');
        
        // Get next occurrence to verify
        const nextOccurrence = await occurrenceService.getNextOccurrence(19);
        if (nextOccurrence) {
          console.log(`   📅 Next occurrence: ${nextOccurrence.occurrence_date}`);
        }
      }
    }

    console.log('\n🎉 Successfully fixed events 4 and 19!');
    
  } catch (error) {
    console.error('❌ Error fixing events:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixEvents().then(() => process.exit(0));
}

module.exports = { fixEvents };