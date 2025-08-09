#!/usr/bin/env node

// Check actual status of events in database
const EventRepository = require('../database/eventRepository');

async function checkEventsStatus() {
  console.log('Checking events status in database...\n');
  
  const eventRepository = new EventRepository();
  
  try {
    // Get all events to see structure
    const allEvents = await eventRepository.findAll();
    
    console.log(`Found ${allEvents?.length || 0} events total\n`);
    
    // Look for events 4 and 19 specifically
    const targetIds = [4, 19];
    
    for (const id of targetIds) {
      const event = await eventRepository.findById(id);
      
      if (event) {
        console.log(`📋 Event ${id}: ${event.title}`);
        console.log(`   Type: ${event.type}`);
        console.log(`   Description: ${event.description}`);
        console.log(`   Lunar: month=${event.lunar_month}, day=${event.lunar_day}, is_leap=${event.is_leap_month}`);
        console.log(`   Solar: month=${event.solar_month}, day=${event.solar_day}`);
        console.log(`   Solar date: ${event.solar_date}`);
        console.log(`   Solar term: ${event.solar_term_name}`);
        console.log(`   One time: ${event.one_time_date}`);
        console.log(`   Created: ${event.created_at}`);
        console.log();
      } else {
        console.log(`❌ Event ${id}: Not found`);
        console.log();
      }
    }
    
    // Show first few events to understand structure
    console.log('=== First 5 events structure ===');
    const firstFew = allEvents?.slice(0, 5) || [];
    firstFew.forEach((event, index) => {
      console.log(`${index + 1}. ID ${event.id}: ${event.title} (${event.type})`);
      if (event.lunar_month) console.log(`   Lunar: ${event.lunar_month}/${event.lunar_day}`);
      if (event.solar_month) console.log(`   Solar: ${event.solar_month}/${event.solar_day}`);
      if (event.solar_term_name) console.log(`   Solar term: ${event.solar_term_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking events:', error.message);
  }
}

checkEventsStatus().then(() => process.exit(0));