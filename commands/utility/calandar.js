const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const ical = require('ical.js');

// Define a mapping of choices to calendar URLs
const calendarURLsMap = {
    'School Timetable': 'https://p64-caldav.icloud.com/published/2/MTE0NDA4ODA1NjIxMTQ0MKVdlM7REBkhsVV4_YqUl4KsYIuanKworzZyfBkazXzOfuG6ab9VK1Ix8MjF7O0HiVmNwWAf3tlRTPTv8ByQsQ8.ical',
    'Scouts Calendar': 'https://p64-caldav.icloud.com/published/2/MTE0NDA4ODA1NjIxMTQ0MKVdlM7REBkhsVV4_YqUl4Lz285d5ws6d2LlIHwLVOXwm-YUcmZbatZXwFN_R_cUkqxwrHUal0CUzwkE61nJot4',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendars')
        .setDescription('Fetches upcoming events from calendars')
        .addStringOption(option =>
            option.setName('calendar')
                .setDescription('Select a calendar')
                .setRequired(true)
                .addChoices(

                    { name: 'School', value: 'School Timetable' },
                    { name: 'Scouts', value: 'Scouts Calendar' },
                )

            // Add more choices for calendars as needed
        )
        .addStringOption(option =>
            option.setName('timeframe')
                .setDescription('Select a timeframe')
                .setRequired(true)
                .addChoices(
                    { name: 'Today', value: 'today' },
                    { name: 'This Week', value: 'this_week' },
                    { name: 'Next Week', value: 'next_week' },
                )
            // Add more choices for timeframes as needed
        ),
    async execute(interaction) {
        if (interaction.user.id === '574783977223749632') {
        try {
            const selectedCalendar = interaction.options.getString('calendar');
            const selectedTimeframe = interaction.options.getString('timeframe');

            // Get the calendar URL based on the selected choice
            const calendarURL = calendarURLsMap[selectedCalendar];

            // Ensure the selected calendar choice has a corresponding URL
            if (!calendarURL) {
                await interaction.reply('Invalid calendar choice.');
                return;
            }

            const calendarURLs = [calendarURL]; // You can expand this array if needed
            const events = await fetchAndParseCalendars(calendarURLs);

            // Filter events based on the selected timeframe (example logic)
            const filteredEvents = filterEventsByTimeframe(events, selectedTimeframe);

            if (filteredEvents.length > 0) {
                const response = filteredEvents.join('\n');
                await interaction.reply(response);
            } else {
                await interaction.reply('No upcoming events found for the selected timeframe.');
            }
        } catch (error) {
            console.error('Error fetching or parsing calendar data:', error);
            await interaction.reply('Error fetching or parsing calendar data.');
        }
    } else {
        interaction.reply({ content: 'You do not have permission to use this command', ephemeral: true })
    }
    },
};


function filterEventsByTimeframe(events, timeframe) {
    const now = new Date();

    switch (timeframe) {
        case 'today':
            return events.filter(event => isSameDay(new Date(event.startDate), now));
        case 'this_week':
            return events.filter(event => isSameWeek(new Date(event.startDate), now));
        case 'next_week':
            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);
            return events.filter(event => isSameWeek(new Date(event.startDate), nextWeek));
        default:
            // If the timeframe is not recognized, return all events
            return events;
    }
}

// Helper functions for date comparison

function isSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

function isSameWeek(date1, date2) {
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    const weekStart = new Date(firstDate.setDate(firstDate.getDate() - firstDate.getDay()));
    const weekEnd = new Date(secondDate.setDate(secondDate.getDate() - secondDate.getDay() + 6));

    // No need to await for Date comparisons (synchronous)
    return weekStart <= date1 && date1 <= weekEnd;
}


async function fetchAndParseCalendars(calendarURLs) {
    const allEvents = [];

    for (const url of calendarURLs) {
        try {
            const calendarData = await fetchCalendarData(url);
            const events = parseCalendarData(calendarData);
            allEvents.push(...events);
        } catch (error) {
            console.error(`Error fetching or parsing calendar data for ${url}:`, error);
        }
    }

    return allEvents;
}

async function fetchCalendarData(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch calendar data. Status: ${response.status}`);
        }

        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        throw error; // Rethrow the error to be handled at the higher level
    }
}


function parseCalendarData(data) {
    // Parse iCalendar data using ical.js
    const jcalData = ical.parse(data);
    const comp = new ical.Component(jcalData);
    const events = comp.getAllProperties('vevent').map((vevent) => {
        const summary = vevent.getFirstPropertyValue('summary');
        const startDate = new Date(vevent.getFirstPropertyValue('dtstart'));

        // Adjust the timezone offset if needed
        const timezoneOffset = startDate.getTimezoneOffset();
        startDate.setMinutes(startDate.getMinutes() - timezoneOffset);

        // Add additional properties as needed

        return `${startDate}: ${summary}`;
    });

    return events;
}

