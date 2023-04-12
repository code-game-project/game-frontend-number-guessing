<script lang="ts">
	import { onMount, beforeUpdate, afterUpdate } from 'svelte';
	import { Game } from '../number-guessing/game';
	import config from '../config';
	import { handleScope } from '../scoping';
	import Table from '../components/generic/table.svelte';
	import TableRow from '../components/generic/table-row.svelte';
	import TableEmpty from '../components/generic/table-empty.svelte';
	import TableCell from '../components/generic/table-cell.svelte';

	let min = 0;
	let lowerBound = 0;
	let targetNumber: number = null;
	let upperBound = 0;
	let max = 0;
	let targetCouldBeMin = true;
	let targetCouldBeMax = true;

	let MAX_GUESSES_DISPLAY = 100;
	let guesses: number[] = [];
	let guessesHitMax = false;
	const addGuess = (number: number) => {
		if (guesses.length === MAX_GUESSES_DISPLAY) {
			guessesHitMax = true;
			guesses.shift();
		}
		guesses = [...guesses, number];
	};
	const resetGuesses = () => {
		guesses = [];
		guessesHitMax = false;
	};
	let guessList: HTMLDivElement;
	let autoscroll = true;
	let avgGuesses = 0;

	let columnWidths = '20% 40% 40%';
	let totalGames = 0;
	const MAX_GAMES_DISPLAY = 10;
	type GameStats = { guesses: number; target: number };
	let games: GameStats[] = [];
	let currentGame: GameStats;
	const newGame = () => {
		totalGames++;
		if (games.length === MAX_GAMES_DISPLAY) games.shift();
		currentGame = { guesses: 0, target: null };
		games = [...games, currentGame];
	};
	newGame();

	const formatNumber = (number: number) => {
		return number.toPrecision(3);
	};

	onMount(async () => {
		let game: Game;
		await handleScope(
			window.location.search,
			null,
			async (gameId) =>
				({ game } = await Game.spectate(config.gameURL, gameId)),
			async (gameId, playerId, playerSecret) =>
				({ game } = await Game.connect(
					config.gameURL,
					gameId,
					playerId,
					playerSecret
				))
		);
		registerListeners(game);
	});

	const registerListeners = async (game: Game) => {
		const config = await game.getConfig();
		min = config.min;
		max = config.max;
		lowerBound = min;
		upperBound = max;
		let immediatelyAfterWin = false;
		const incorrect = (number: number) => {
			immediatelyAfterWin = false;
			targetNumber = null;
			addGuess(number);
			currentGame.guesses++;
			games = games;
		};
		game.onTooLow(({ number }) => {
			if (immediatelyAfterWin) {
				upperBound = max;
				targetCouldBeMax = true;
			}
			lowerBound = number;
			targetCouldBeMin = false;
			incorrect(number);
		});
		game.onTooHigh(({ number }) => {
			if (immediatelyAfterWin) {
				lowerBound = min;
				targetCouldBeMin = true;
			}
			upperBound = number;
			targetCouldBeMax = false;
			incorrect(number);
		});
		game.onCorrect(({ number, tries }) => {
			targetNumber = number;
			if (immediatelyAfterWin) {
				lowerBound = min;
				upperBound = max;
				targetCouldBeMin = false;
				targetCouldBeMax = false;
			}
			immediatelyAfterWin = true;
			resetGuesses();
			currentGame.guesses = tries;
			currentGame.target = number;
			avgGuesses = ((totalGames - 1) * avgGuesses + tries) / totalGames;
			// not reassigning games to itsself here because `newGame` already does that
			newGame();
		});
	};

	beforeUpdate(() => {
		autoscroll =
			guessList &&
			guessList.offsetWidth + guessList.scrollLeft > guessList.scrollWidth - 20;
	});
	afterUpdate(() => {
		if (autoscroll) guessList.scrollTo(guessList.scrollWidth, 0);
	});

	let mobileMode: boolean;
</script>

<section id="view">
	<div id="display">
		<div id="min">
			<span class="big">{formatNumber(min)}</span>
			<span>Minimum</span>
		</div>
		<div class="operator">
			<span class="big">
				{#if min === lowerBound}
					&le;
				{:else}
					&lt;
				{/if}
			</span>
		</div>
		<div id="lower-bound">
			<span class="big">{formatNumber(lowerBound)}</span>
			{#if min === lowerBound}
				<span>Minimum</span>
			{:else}
				<span>Too Low</span>
			{/if}
		</div>
		<div class="operator">
			<span class="big">
				{#if targetCouldBeMin}
					&le;
				{:else}
					&lt;
				{/if}
			</span>
		</div>
		<div id="target-number">
			<span class="big"
				>{targetNumber !== null ? formatNumber(targetNumber) : '?'}</span
			>
			<span>Target Number</span>
		</div>
		<div class="operator">
			<span class="big">
				{#if targetCouldBeMax}
					&le;
				{:else}
					&lt;
				{/if}
			</span>
		</div>
		<div id="upper-bound">
			<span class="big">{formatNumber(upperBound)}</span>
			{#if max === upperBound}
				<span>Maximum</span>
			{:else}
				<span>Too High</span>
			{/if}
		</div>
		<div class="operator">
			<span class="big">
				{#if max === upperBound}
					&le;
				{:else}
					&lt;
				{/if}
			</span>
		</div>
		<div id="max">
			<span class="big">{formatNumber(max)}</span>
			<span>Maximum</span>
		</div>
	</div>
	<div id="guesses">
		<div>
			<span
				>Guesses ({guessesHitMax
					? `${MAX_GUESSES_DISPLAY}+`
					: guesses.length}):</span
			>
		</div>
		<div id="guess-list" bind:this={guessList}>
			{#each guesses as guess, i (i)}
				{#if i !== 0}
					<span>, </span>
				{/if}
				<span>{formatNumber(guess)}</span>
			{/each}
		</div>
	</div>
</section>
<section id="results">
	<Table mobileModeWidthPx={700} bind:mobileMode>
		<div slot="head">
			<TableRow {columnWidths} mobileMode={false}>
				<TableCell>Game</TableCell>
				<TableCell>Target</TableCell>
				<TableCell>Guesses (Avg. {avgGuesses})</TableCell>
			</TableRow>
		</div>
		{#if games.length > 0}
			{#each games as { guesses, target }, index (index)}
				<TableRow {columnWidths} {mobileMode}>
					<TableCell>#{totalGames - games.length + index + 1}</TableCell>
					<TableCell>{target ?? '?'}</TableCell>
					<TableCell>{guesses}</TableCell>
				</TableRow>
			{/each}
		{:else}
			<TableEmpty>No games have been finished yet.</TableEmpty>
		{/if}
	</Table>
</section>

<style lang="scss" scoped>
	section#view {
		border: 1px solid var(--background-light);
		border-radius: var(--radius);
		overflow: hidden;
		padding: var(--padding);
		margin-bottom: var(--padding);
		> div {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: var(--padding);
		}
		> div#display {
			overflow-x: auto;
			> div {
				display: flex;
				flex-direction: column;
				span {
					text-align: center;
				}
				span.big {
					font-size: 54px;
					line-height: 54px;
				}
			}
		}
		> div#guesses {
			margin-top: var(--padding);
			> div#guess-list {
				width: 50%;
				overflow-x: scroll;
				white-space: nowrap;
				text-align: right;
				-ms-overflow-style: none; /* IE and Edge */
				scrollbar-width: none; /* Firefox */
			}
			> div#guess-list::-webkit-scrollbar {
				display: none; /* Chrome, Safari, Opera */
			}
		}
	}
</style>
