// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: brain;
const displayLessonsAs = 'COUNT'; // options are 'COUNT' and 'HOURS'
const displayCoversAs = 'COUNT'; // options are 'COUNT' and 'HOURS'
const lessonRealHours = 0.75; // in germany one school lesson is 45min
const backgroundColorForDark = new Color("#1A1A1A");
const backgroundColorForLight = new Color("#FFFFFF");
const textColorForDark = new Color("#FFFFFF");
const textColorForLight = new Color("#1A1A1A");
const dataFileName = "TeacherTimeTrackerData.json";

// Translations can be adapted for your language
const translations = {
    trackingActive: 'Time tracking active',
    trackingInactive: 'Time tracking not active',
    trackingStarted: 'Time tracking started',
    trackingStopped: 'Time tracking stopped',
    coversAdded: 'Covers added',
    canceledLessonsAdded: 'Cancellations added',
    startedAt: 'Started at',
    workingHours: 'Working hours',
    today: 'today',
    currentWeek: 'cur. week',
    currentMonth: 'cur. month',
    covers: 'Covers',
    coversAbbreviation: 'Covers',
    registeredFor: 'registered for',
    canceledLessons: 'Cancellations',
    canceledLessonsAbbreviation: 'Cancel.',
    lessons: 'Lessons',
    lessonsAbbreviation: 'Ls',
    oClock: 'o\'clock',
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    category: "Category",
    sum: "Sum",
    calendarWeekAbbreviation: "CW",
    lessonsSet: 'Lessons were configured',
    manuaTrackingDone: 'Time was registered'
};

// Data storage settings
const fm = FileManager.iCloud(); // Use FileManager.local() for local storage
const filePathData = fm.joinPath(fm.documentsDirectory(), dataFileName); // Path to the JSON file

// Date and time keys
const today = new Date();
const dayKey = getDayKey(today); // Format today's date with day.month.year
const weekKey = getWeekKey(today); // Format current week as "week.year"
const monthKey = getMonthKey(today); // Format current month as "month.year"

// when setting up the widget you can provide one of those params to change what is displayed
const widgetDisplayModes = {
    TRACKING_STATUS: 'TRACKING_STATUS', // <- default
    WEEKS_HISTORY: 'WEEKS_HISTORY',
    MONTHS_HISTORY: 'MONTHS_HISTORY',
};

// Commands that will be provided by the Shortcut-app
const commands = {
    START: 'START',
    STOP: 'STOP',
    COVERS: 'COVERS',
    CANCELED_LESSONS: 'CANCELED_LESSONS',
    DISCARD: 'DISCARD',
    SET_LESSONS: 'SET_LESSONS',
    MANUAL_TRACKING: 'MANUAL_TRACKING'
};

const icons = {
    active: SFSymbol.named("stopwatch"),
    inactive: SFSymbol.named("stop.circle"),
    covers: SFSymbol.named("person.2.fill"),
    canceledLessons: SFSymbol.named("bandage"),
    setLessons: SFSymbol.named("pencil"),
    manualTracking: SFSymbol.named("calendar.badge.plus")
};

const iconColors = {
    active: Color.green(),
    inactive: Color.red(),
    covers: Color.purple(),
    canceledLessons: Color.blue(),
    setLessons: Color.orange(),
    manualTracking: Color.yellow(),
};

// Fetch stored data or initialize if missing
const data = getFileData(filePathData, {
    currentStartTime: null,
    workedHours: {byDay: {}, byWeek: {}, byMonth: {}},
    covers: {byDay: {}, byWeek: {}, byMonth: {}},
    canceledLessons: {byDay: {}, byWeek: {}, byMonth: {}},
    categories: {}, // dynamic fields with objects {byDay: {}, byWeek: {},byMonth: {}}
    lessons: {
        schedule: {monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0},
        firstDayOfLessons: "2024-09-10",
        lastDayOfLessons: "2025-07-31"
    }
});
let firstDayOfLessons = new Date(data.lessons.firstDayOfLessons);
let lastDayOfLessons = new Date(data.lessons.lastDayOfLessons);

const widgetColorConfig = getWidgetColorConfig();
const displayMode = (args.widgetParameter || widgetDisplayModes.TRACKING_STATUS).toUpperCase(); // Default to "TRACKING_STATUS"
const shortCutParams = args.shortcutParameter;
const statusFont = Font.boldSystemFont(16);
const headerFont = Font.boldSystemFont(15);
const infoFont = Font.systemFont(14);
const amountOfMonthsShownInHistory = 3;
const amountOfWeeksShownInHistory = 3;
const workWeekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; // do not change
let status = translations.trackingInactive;
let statusSub = null;
let icon = icons.inactive;
let iconColor = iconColors.inactive;

function updateCurrentStatus() {
    if (shortCutParams) {
        const [command, commandData] = shortCutParams.split(';');
        let amount, dateString, date, category;
        switch (command) {
            case commands.START:
                status = translations.trackingStarted;
                icon = icons.active;
                iconColor = iconColors.active;
                if (!data.currentStartTime) data.currentStartTime = today.toISOString();
                statusSub = `${translations.startedAt}: ${formatTime(new Date(data.currentStartTime))}`;
                break;

            case commands.DISCARD:
                status = data.currentStartTime ? translations.trackingStopped : translations.trackingInactive;
                icon = icons.inactive;
                iconColor = iconColors.inactive;
                data.currentStartTime = null;
                break;

            case commands.MANUAL_TRACKING:
                [workedHoursString, dateString, category] = commandData.split('_');
                date = new Date(dateString);
                const formatCheck = /^-?(\d+h)?(\d+m)?$/;
                if (!formatCheck.test(workedHoursString)) {
                    return; // do nothing if not valid
                }
                const workedHours = workedHoursStringToDecimal(workedHoursString);
                const localDayKey = getDayKey(date);
                const localWeekKey = getWeekKey(date);
                const localMonthKey = getMonthKey(date);
                data.workedHours.byDay[localDayKey] = (data.workedHours.byDay[localDayKey] || 0) + workedHours;
                data.workedHours.byWeek[localWeekKey] = (data.workedHours.byWeek[localWeekKey] || 0) + workedHours;
                data.workedHours.byMonth[localMonthKey] = (data.workedHours.byMonth[localMonthKey] || 0) + workedHours;

                if (!data.categories[category]) {
                    data.categories[category] = {byDay: {}, byMonth: {}, byWeek: {}};
                }
                data.categories[category].byDay[localDayKey] = (data.categories[category].byDay[localDayKey] || 0) + workedHours;
                data.categories[category].byWeek[localWeekKey] = (data.categories[category].byWeek[localWeekKey] || 0) + workedHours;
                data.categories[category].byMonth[localMonthKey] = (data.categories[category].byMonth[localMonthKey] || 0) + workedHours;

                status = translations.manuaTrackingDone;
                statusSub = `${workedHoursString}, ${getDayKey(date)}, ${category}`;
                icon = icons.manualTracking;
                iconColor = iconColors.manualTracking;
                break;

            case commands.SET_LESSONS:
                const [mon, tue, wed, thu, fri, firstDayOfLessonsString, lastDayOfLessonsString] = commandData.split('_');
                if (!mon || !tue || !wed || !thu || !fri) {
                    return;
                }
                data.lessons = {
                    schedule: {
                        monday: Number(mon),
                        tuesday: Number(tue),
                        wednesday: Number(wed),
                        thursday: Number(thu),
                        friday: Number(fri)
                    },
                    firstDayOfLessons: new Date(firstDayOfLessonsString),
                    lastDayOfLessons: new Date(lastDayOfLessonsString),
                };
                status = translations.lessonsSet;
                const mondayText = `${translations.dayNames[0]}=${mon}`;
                const tuesdayText = `${translations.dayNames[1]}=${tue}`;
                const wednesdayText = `${translations.dayNames[2]}=${wed}`;
                const thursdayText = `${translations.dayNames[3]}=${thu}`;
                const fridayText = `${translations.dayNames[4]}=${fri}`;
                statusSub = `${mondayText}, ${tuesdayText}, ${wednesdayText}, ${thursdayText}, ${fridayText}`
                icon = icons.setLessons;
                iconColor = iconColors.setLessons;
                break;

            case commands.STOP:
                if (data.currentStartTime) {
                    const startTime = new Date(data.currentStartTime);
                    const endTime = today;
                    const workedHours = (endTime - startTime) / 3600000;
                    data.workedHours.byDay[dayKey] = (data.workedHours.byDay[dayKey] || 0) + workedHours;
                    data.workedHours.byWeek[weekKey] = (data.workedHours.byWeek[weekKey] || 0) + workedHours;
                    data.workedHours.byMonth[monthKey] = (data.workedHours.byMonth[monthKey] || 0) + workedHours;

                    if (commandData) {
                        if (!data.categories[commandData]) {
                            data.categories[commandData] = {byDay: {}, byMonth: {}, byWeek: {}};
                        }
                        data.categories[commandData].byDay[dayKey] = (data.categories[commandData].byDay[dayKey] || 0) + workedHours;
                        data.categories[commandData].byWeek[weekKey] = (data.categories[commandData].byWeek[weekKey] || 0) + workedHours;
                        data.categories[commandData].byMonth[monthKey] = (data.categories[commandData].byMonth[monthKey] || 0) + workedHours;
                    }
                    status = translations.trackingStopped;
                    icon = icons.inactive;
                    iconColor = iconColors.inactive;
                    statusSub = `+${formatHours(workedHours)} (${formatTime(startTime)} - ${formatTime(endTime)})`;
                    data.currentStartTime = null;
                }
                break;

            case commands.COVERS:
                [amount, dateString] = commandData.split('_');
                date = new Date(dateString);
                status = `${translations.coversAdded}`;
                statusSub = `${amount} ${translations.registeredFor} ${getDayKey(date)}`
                icon = icons.covers;
                iconColor = iconColors.covers;
                data.covers.byDay[getDayKey(date)] = (data.covers.byDay[getDayKey(date)] || 0) + Number(amount);
                data.covers.byWeek[getWeekKey(date)] = (data.covers.byWeek[getWeekKey(date)] || 0) + Number(amount);
                data.covers.byMonth[getMonthKey(date)] = (data.covers.byMonth[getMonthKey(date)] || 0) + Number(amount);
                break;

            case commands.CANCELED_LESSONS:
                [amount, dateString] = commandData.split('_');
                date = new Date(dateString);
                status = `${translations.canceledLessonsAdded}`;
                statusSub = `${amount} ${translations.registeredFor} ${getDayKey(date)}`
                icon = icons.canceledLessons;
                iconColor = iconColors.canceledLessons;
                data.canceledLessons.byDay[getDayKey(date)] = (data.canceledLessons.byDay[getDayKey(date)] || 0) + Number(amount);
                data.canceledLessons.byWeek[getWeekKey(date)] = (data.canceledLessons.byWeek[getWeekKey(date)] || 0) + Number(amount);
                data.canceledLessons.byMonth[getMonthKey(date)] = (data.canceledLessons.byMonth[getMonthKey(date)] || 0) + Number(amount);
                break;
        }
        saveFileData(filePathData, data);
    } else if (data.currentStartTime) {
        // if here, then just the current state should be displayed
        const isTrackingActive = !!data.currentStartTime;
        status = isTrackingActive ? translations.trackingActive : translations.trackingInactive;
        statusSub = isTrackingActive ? `${translations.startedAt}: ${formatTime(new Date(data.currentStartTime))}` : null;
        icon = isTrackingActive ? icons.active : icons.inactive;
        iconColor = isTrackingActive ? iconColors.active : iconColors.inactive;
    }
}

function createTrackingStatusWidgetUI() {
    const widget = new ListWidget();
    const topStack = widget.addStack();
    topStack.layoutHorizontally();
    topStack.addSpacer();
    const content = topStack.addStack();
    topStack.addSpacer();
    content.layoutVertically();

    // Top Section: Status Icon and Text
    const statusStack = content.addStack();
    statusStack.layoutHorizontally();

    const statusImageStack = statusStack.addStack();
    statusImageStack.layoutVertically();
    const iconImage = statusImageStack.addImage(icon.image);
    iconImage.imageSize = new Size(30, 30);
    iconImage.tintColor = iconColor;
    const placeHolder = addCustomText(statusImageStack, '', infoFont);

    statusStack.addSpacer(10);

    const statusTextStack = statusStack.addStack();
    statusTextStack.addSpacer(statusSub ? 0 : 5);
    statusTextStack.layoutVertically();
    const trackingText = addCustomText(statusTextStack, status, statusFont);
    if (statusSub) {
        content.addSpacer(3);
        const startedAtValue = addCustomText(statusTextStack, statusSub, infoFont);
    }

    content.addSpacer(10); // status and infos

    const columns = content.addStack();
    columns.layoutHorizontally();
    columns.centerAlignContent();

    // First Column: Labels
    const column1 = columns.addStack();
    column1.layoutVertically();
    column1.centerAlignContent();

    const col1Header = addCustomText(column1, ' ', headerFont);
    column1.addSpacer(3); // Spacer between header and rows
    const dailyLabel = addCustomText(column1, `${translations.today}:`, infoFont);
    const weeklyLabel = addCustomText(column1, `${translations.currentWeek}:`, infoFont);
    const monthlyLabel = addCustomText(column1, `${translations.currentMonth}:`, infoFont);
    columns.addSpacer(); // Spacer between columns

    // Second Column: Values for WorkingHours
    const column2 = columns.addStack();
    column2.layoutVertically();
    column2.centerAlignContent();

    const col2Header = addCustomText(column2, translations.workingHours, headerFont);
    column2.addSpacer(3); // Spacer between header and rows
    const dailyValue = addCustomText(column2, formatHours(data.workedHours.byDay[dayKey] || 0), infoFont);
    const weeklyValue = addCustomText(column2, formatHours(data.workedHours.byWeek[weekKey] || 0), infoFont);
    const monthlyValue = addCustomText(column2, formatHours(data.workedHours.byMonth[monthKey] || 0), infoFont);
    columns.addSpacer(); // Spacer between columns

    // Third Column: Header for lessons
    const column3 = columns.addStack();
    column3.layoutVertically();
    column3.centerAlignContent();

    const col3Header = addCustomText(column3, translations.lessonsAbbreviation, headerFont);
    column3.addSpacer(3); // Spacer between header and rows

    const actualLessonsToday = getDifferenceOrZero(getLessonsOfToday(), data.canceledLessons.byDay[dayKey] || 0);
    const dailyLessonsValueText = addCustomText(column3, `${actualLessonsToday}x`, infoFont);
    const actualLessonsWeek = getActualLessonsCountInWeek(weekKey);
    const weeklyLessonsValueText = addCustomText(column3, `${actualLessonsWeek}x`, infoFont);
    const actualLessonsInMonth = getActualLessonsCountInMonth(monthKey);
    const monthlyLessonsValueText = addCustomText(column3, `${actualLessonsInMonth}x`, infoFont);
    columns.addSpacer(); // Spacer between columns

    // Fourth Column: Header for covers
    const column4 = columns.addStack();
    column4.layoutVertically();
    column4.centerAlignContent();

    const col4Header = addCustomText(column4, translations.coversAbbreviation, headerFont);
    column4.addSpacer(3); // Spacer between header and rows
    const dailyCoversValue = addCustomText(column4, `${data.covers.byDay[dayKey] || 0}x`, infoFont);
    const weeklyCoversValue = addCustomText(column4, `${data.covers.byWeek[weekKey] || 0}x`, infoFont);
    const monthlyCoversValue = addCustomText(column4, `${data.covers.byMonth[monthKey] || 0}x`, infoFont);

    return widget;
}

// periodType: "WEEK" | "MONTH"
function addHistoryColumn(stack, period, periodType, dataType) {
    const columnStack = stack.addStack();
    columnStack.layoutVertically();

    const header = addCustomText(columnStack, getHistoryColumnHeader(period, periodType), headerFont);
    columnStack.addSpacer(3);
    Object.keys(data.categories).forEach(category => {
        const hours = (data.categories[category][dataType] && data.categories[category][dataType][period]) || 0;
        const hourText = addCustomText(columnStack, formatHours(hours), infoFont);
        columnStack.addSpacer(3);
    });

    let lessonsCount = 0;
    if (periodType === "WEEK") {
        lessonsCount = getActualLessonsCountInWeek(period);
    } else if (periodType === "MONTH") {
        lessonsCount = getActualLessonsCountInMonth(period);
    }
    const shownLessons = displayLessonsAs === 'COUNT' ? `${lessonsCount}x` : formatHours(lessonsCount * lessonRealHours);
    const lessonText = addCustomText(columnStack, shownLessons, infoFont);
    columnStack.addSpacer(3);

    const coversCount = (data.covers[dataType] && data.covers[dataType][period]) || 0;
    const shownCovers = displayCoversAs === 'COUNT' ? `${coversCount}x` : formatHours(coversCount * lessonRealHours);
    const coversText = addCustomText(columnStack, shownCovers, infoFont);
    columnStack.addSpacer(3);

    const canceledLessonsCount = (data.canceledLessons[dataType] && data.canceledLessons[dataType][period]) || 0;
    const lessonsOverallCount = canceledLessonsCount >= lessonsCount ? 0 : lessonsCount - canceledLessonsCount;
    let sum = Object.keys(data.categories).reduce((acc, category) => acc + ((data.categories[category][dataType] && data.categories[category][dataType][period]) || 0), 0);
    sum += lessonsOverallCount * lessonRealHours;
    sum += coversCount * lessonRealHours;
    const sumText = addCustomText(columnStack, formatHours(sum), Font.systemFont(14));
    columnStack.addSpacer(3);
}

// periodType: "WEEK" | "MONTH"
function createHistoryWidgetUI(dataType, periodType, amountShown) {
    const periods = Object.keys(data.workedHours[dataType] || {}).sort().slice(-amountShown).reverse();

    const widget = new ListWidget();
    widget.setPadding(10, 10, 10, 10);
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();

    const categoryStack = mainStack.addStack();
    categoryStack.layoutVertically();

    const categoryHeader = addCustomText(categoryStack, translations.category, headerFont);
    categoryStack.addSpacer(3);
    Object.keys(data.categories).forEach(category => {
        const categoryText = addCustomText(categoryStack, category, infoFont);
        categoryStack.addSpacer(3);
    });

    const lessonsText = addCustomText(categoryStack, translations.lessons, infoFont);
    categoryStack.addSpacer(3);
    const coversText = addCustomText(categoryStack, translations.coversAbbreviation, infoFont);
    categoryStack.addSpacer(3);
    const sumText = addCustomText(categoryStack, translations.sum, Font.boldSystemFont(14));
    categoryStack.addSpacer(3);

    periods.forEach(period => {
        mainStack.addSpacer(4);
        addHistoryColumn(mainStack, period, periodType, dataType);
    });

    return widget;
}

// Utility Functions
function getWidgetColorConfig() {
    if (Device.isUsingDarkAppearance()) {
        return {
            widgetBackground: backgroundColorForDark,
            widgetText: textColorForDark
        };
    } else {
        return {
            widgetBackground: backgroundColorForLight,
            widgetText: textColorForLight
        };
    }
}

function getActualLessonsCountInWeek(localWeekKey) {
    const weekdaysCountInWeek = countWeekdaysInWeek(Number(localWeekKey.split('.')[0]), Number(localWeekKey.split('.')[1]));
    const lessonsCountInWeek = calculateWeekdayProductSum(data.lessons.schedule, weekdaysCountInWeek);
    return getDifferenceOrZero(lessonsCountInWeek, data.canceledLessons.byWeek[localWeekKey] || 0);
}

function getActualLessonsCountInMonth(localMonthKey) {
    const weekdaysCountInMonth = countWeekdaysInMonth(Number(localMonthKey.split('.')[0]), Number(localMonthKey.split('.')[1]));
    const lessonsCountInMonth = calculateWeekdayProductSum(data.lessons.schedule, weekdaysCountInMonth);
    return getDifferenceOrZero(lessonsCountInMonth, data.canceledLessons.byMonth[localMonthKey] || 0);
}

function getDifferenceOrZero(val1, val2) {
    return val1 > val2 ? val1 - val2 : 0;
}

function workedHoursStringToDecimal(workedHoursString) {
    let hours = 0;
    let minutes = 0;
    // Check if the string starts with a minus
    const isNegative = workedHoursString.startsWith('-');

    // Match hours and minutes as before
    const hourMatch = workedHoursString.match(/(\d+)h/);
    if (hourMatch) {
        hours = parseInt(hourMatch[1]);
    }
    const minuteMatch = workedHoursString.match(/(\d+)m/);
    if (minuteMatch) {
        minutes = parseInt(minuteMatch[1]);
    }
    // Convert to decimal and return as negative if needed
    let result = hours + minutes / 60;
    return isNegative ? -result : result;
}

function getFileData(path, defaultValue = {}) {
    if (fm.fileExists(path)) {
        try {
            return JSON.parse(fm.readString(path));
        } catch (e) {
            console.error(`Error reading data from ${path}: ${e}`);
            Script.complete();
        }
    }
    return defaultValue;
}

function saveFileData(path, data) {
    try {
        fm.writeString(path, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error(`Error writing data to ${path}: ${e}`);
    }
}

function formatTime(date) {
    return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)} ${translations.oClock}`;
}

function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m}m`;
}

function getDayKey(date) {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`; // Format date as day.month.year
}

function getWeekKey(date) {
    // Create a copy of the date object so the original is not modified
    const target = new Date(date.valueOf());

    // Set the target to the nearest Thursday (ISO 8601 week starts on Monday)
    const dayNumber = (date.getDay() + 6) % 7; // Adjust so Monday is 0, Sunday is 6
    target.setDate(target.getDate() - dayNumber + 3);

    // Get the first Thursday of the year
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((target - firstThursday) / 86400000); // Days since first Thursday

    // Calculate the week number
    const week = Math.floor(dayOfYear / 7) + 1;

    // Return the formatted week.year string
    return `${week}.${target.getFullYear()}`;
}

function getMonthKey(date) {
    return `${date.getMonth() + 1}.${date.getFullYear()}`; // Format current month as "month.year"
}

function getHistoryColumnHeader(period, type) {
    return type === "MONTH"
        ? translations.monthNames[parseInt(period.split('.')[0]) - 1]
        : `${translations.calendarWeekAbbreviation}${period.split('.')[0]}`;
}

function countWeekdaysInMonth(month, year) {
    const firstDayOfMonth = new Date(year, month - 1, 1); // 1st day of the month
    const lastDayOfMonth = new Date(year, month, 0); // Last day of the month

    // Object to hold the count of weekdays
    const weekdayCounts = {monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0};

    // Adjust the start and end date range to be within the lessons period
    const startDate = (firstDayOfMonth < firstDayOfLessons) ? firstDayOfLessons : firstDayOfMonth;
    let endDate = (lastDayOfMonth > lastDayOfLessons) ? lastDayOfLessons : lastDayOfMonth;
    if (startDate < today && today < endDate) {
        endDate = today;
    }
    if (startDate > endDate) return weekdayCounts; // If no overlap, return zeros

    // Calculate the number of weekdays within the adjusted range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() >= 1 && date.getDay() <= 5) { // Monday to Friday are 1-5
            let dayOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"][date.getDay() - 1];
            weekdayCounts[dayOfWeek]++;
        }
    }
    return weekdayCounts;
}

function countWeekdaysInWeek(weekOfYear, year) {
    // Calculate the start and end date of the week in the given year
    const firstDayOfYear = new Date(year, 0, 1); // January 1st
    const firstWeekStart = firstDayOfYear.getDay() <= 4 ?
        new Date(year, 0, 1 - firstDayOfYear.getDay() + 1) :
        new Date(year, 0, 8 - firstDayOfYear.getDay() + 1);

    // Set the date to the start of the given week
    const startOfWeek = new Date(firstWeekStart);
    startOfWeek.setDate(startOfWeek.getDate() + (weekOfYear - 1) * 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Sunday)

    // Object to hold the count of weekdays
    const weekdayCounts = {monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0};

    // Adjust the start and end date range to be within the lessons period
    const startDate = (startOfWeek < firstDayOfLessons) ? firstDayOfLessons : startOfWeek;
    let endDate = (endOfWeek > lastDayOfLessons) ? lastDayOfLessons : endOfWeek;
    if (startDate < today && today < endDate) {
        endDate = today;
    }

    if (startDate > endDate) return weekdayCounts; // If no overlap, return zeros

    // Calculate the number of weekdays within the adjusted range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() >= 1 && date.getDay() <= 5) { // Monday to Friday are 1-5
            let dayOfWeek = workWeekdays[date.getDay() - 1];
            weekdayCounts[dayOfWeek]++;
        }
    }
    return weekdayCounts;
}

function calculateWeekdayProductSum(obj1, obj2) {
    let totalSum = 0;
    workWeekdays.forEach(day => {
        const product = (obj1[day] || 0) * (obj2[day] || 0); // Calculate the product for each day
        totalSum += product; // Add the product to the total sum
    });

    return totalSum;
}

function getLessonsOfToday() {
    if (!data.lessons.schedule) return 0;
    const todayIndex = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    // Check if today is a weekday (Monday to Friday)
    if (todayIndex >= 1 && todayIndex <= 5) {
        const currentDay = workWeekdays[todayIndex - 1]; // Adjust index for weekdays array
        return data.lessons.schedule[currentDay] || 0;
    }
    // If today is Saturday or Sunday, return 0
    return 0;
}

function addCustomText(stack, textContent, font, minScaleFactor = 0.5, lineLimit = 1) {
    const textElement = stack.addText(textContent);
    textElement.font = font;
    textElement.minimumScaleFactor = minScaleFactor;
    textElement.lineLimit = lineLimit;
    textElement.textColor = widgetColorConfig.widgetText;
    return textElement;
}

// Utility Functions End

// Actual start of script execution:
let widget;
if (displayMode === widgetDisplayModes.TRACKING_STATUS) {
    updateCurrentStatus();
    widget = createTrackingStatusWidgetUI();
} else if (displayMode === widgetDisplayModes.WEEKS_HISTORY) {
    widget = createHistoryWidgetUI("byWeek", "WEEK", amountOfWeeksShownInHistory);
} else if (displayMode === widgetDisplayModes.MONTHS_HISTORY) {
    widget = createHistoryWidgetUI("byMonth", "MONTH", amountOfMonthsShownInHistory);
}
widget.backgroundColor = widgetColorConfig.widgetBackground;

if (config.runsInWidget) {
    Script.setWidget(widget);
    Script.complete();
} else {
    widget.presentMedium();
}