/**
 * Possible log levels and their corresponding colors.
 * Used for configuring the logger.
 *
 * Possible options are:
 *  - Font styles: `bold`, `dim`, `italic`, `underline`, `inverse`, `hidden`, `strikethrough`
 * 	- Font foreground colors: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `grey`
 *  - Background colors: `blackBG`, `redBG`, `greenBG`, `yellowBG`, `blueBG` `magentaBG`, `cyanBG`, `whiteBG`
 */
export const LevelConfig = {
	levels: {
		silent: 6,
		debug: 5,
		info: 3,
		warn: 2,
		error: 1,
		crit: 0,
	},
	colors: {
		silent: "gray",
		debug: "blue",
		info: "green",
		warn: "yellow",
		error: "red",
		crit: "magenta",
	},
} as const;
