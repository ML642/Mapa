const RELAX_CATEGORY_MAP = {
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
	Разное: "entertainment",
	Спорт: "sport",
	"Для детей": "kids",
	Квест: "quest",
};

module.exports = {
	RELAX_CATEGORY_MAP,
	RELAX_CATEGORIES: Object.keys(RELAX_CATEGORY_MAP),
};
