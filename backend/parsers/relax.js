// parsers/relax.js
const axios = require("axios");
const cheerio = require("cheerio");
// const connectDB = require("../config/db");
// connectDB();
const DEBUG = process.env.DEBUG === "true";
const { upsertParsedEvent } = require("../services/parserEventIngestionService");

const categoryMap = {
	Выставка: "expo",
	Кино: "kino",
	Спектакль: "theatre",
	Концерт: "conserts",
	"Новый год": "ny",
	Вечеринка: "clubs",
	Экскурсия: "ekskursii",
	Бесплатные: "free",
	Стендап: "stand-up",
	Мероприятие: "event",
	Образование: "education",
	Фестиваль: "festivali",
	Квизы: "kviz",
	Разное: "entertainment", //
	Спорт: "sport",
	"Для детей": "kids",
	Квест: "quest",
};

exports.parseSiteLinks = async () => {
	const stats = {
		created: 0,
		updated_review: 0,
		updated_auto: 0,
		unchanged: 0,
		ignored: 0,
		skipped_existing: 0,
		failed: 0,
	};

	for (const category of Object.keys(categoryMap)) {
		const s = await exports.parseSiteLinksByCategory(category);
		for (const key of Object.keys(s)) stats[key] += s[key];
	}

	return stats;
};

exports.parseSiteLinksByCategory = async (category, size = 1000) => {
	try {
		const time = Date.now();
		if (!categoryMap[category]) throw new Error("Invalid category");

		const siteCategory = categoryMap[category];
		const url = `https://afisha.relax.by/${siteCategory}/minsk`;

		const { data: html } = await axios.get(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			},
		});

		const $ = cheerio.load(html);
		const links = new Set();

		$("a.js-schedule__event-link.schedule__event-link.link").each((i, el) => {
			const href = $(el).attr("href");
			if (href && href.startsWith(`https://afisha.relax.by/${siteCategory}/`)) links.add(href);
		});

		if (links.size === 0) return;

		if (DEBUG) {
			console.log(links);
			console.log(`time ${Date.now() - time} ms`);
		}

		const stats = {
			created: 0,
			updated_review: 0,
			updated_auto: 0,
			unchanged: 0,
			ignored: 0,
			skipped_existing: 0,
			failed: 0,
		};

		for (const link of links) {
			if (stats.created >= size) break;
			stats[await exports.parseSiteLink(link, category)]++;
		}

		return stats;
	} catch (err) {
		console.error("Parsing links error:", err.message);
		return 0;
	}
};

exports.parseSiteLink = async (link, category) => {
	try {
		if (!link) throw new Error("Invalid link");

		const { data: html } = await axios.get(link, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			},
		});

		const parsed = extractEventData(html, category); //2c

		if (parsed?.description.length < 7 || parsed?.address === "г. Минск") return "ignored";

		const { result } = await upsertParsedEvent({
			payload: {
				parserSource: "relax",
				sourceUrl: link,
				...parsed,
			},
		});

		return result;
	} catch (err) {
		console.error("Parsing link error:", err.message, link);
		return "failed";
	}
};

const extractEventData = (html, category) => {
	const $ = cheerio.load(html);

	let address,
		coordinates,
		price;
	const phone = [];
	const dates = [];

	const title = $("div.b-afisha-layout-theater_full").attr("data-name");
	const descriptionHTML = $("div.b-afisha_cinema_description_text").html() || "";
	const description = descriptionHTML
		.replace(/<\/p>/g, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&laquo;/g, "«")
		.replace(/&raquo;/g, "»")
		.replace(/&mdash;/g, "—")
		.trim();

	const event_image_url = $("img.b-afisha-event__image").attr("src");

	$("span.b-afisha_cinema_description_table_desc a").each((i, el) => {
		const href = $(el).attr("href");
		if (href && href.startsWith("tel:")) phone.push(href.replace("tel:", ""));
	});

	$("li").each((i, el) => {
		const label = $(el).find("span.b-afisha_cinema_description_table_name").text().trim();
		const valueElement = $(el).find("span.b-afisha_cinema_description_table_desc");

		switch (label) {
			case "Стоимость:":
			case "Стоимость билетов:":
			case "Вход:":
				price = valueElement
					.text()
					.replace(/<\/p>/g, "\n")
					.replace(/<[^>]*>/g, "")
					.replace(/&mdash;/g, "—")
					.trim();
				break;
		}
	});

	$("div.schedule__item").each((i, el) => {
		const date = $(el).find("div.schedule__day meta").attr("content");
		const times = $(el).find(".schedule__seance-time").text().split(/\s+/);

		for (const time of times) {
			const d = new Date(`${date}T${time}:00+03:00`);
			if (!isNaN(d)) dates.push(d);
		}
	});

	$('script[type="application/ld+json"]').each((i, el) => {
		const raw = $(el).html();
		const addressMatch = raw.match(/"streetAddress"\s*:\s*"([^"]+)"/);
		if (addressMatch) address = addressMatch[1].replace("г. Минск, ", "").trim();

		const latMatch = raw.match(/"latitude"\s*:\s*"([^"]+)"/);
		const lonMatch = raw.match(/"longitude"\s*:\s*"([^"]+)"/);
		if (latMatch && lonMatch) {
			const latitude = Number(latMatch[1]);
			const longitude = Number(lonMatch[1]);
			coordinates = [latitude, longitude];
		}
	});

	return {
		title,
		description,
		address,
		coordinates,
		phone: phone.join(", "),
		price_description: price,
		event_dates: dates,
		category,
		event_image_url,
	};
};
