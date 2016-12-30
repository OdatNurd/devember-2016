module nurdz.game
{
    /**
     * The font that is used for the title font.
     */
    const TITLE_FONT = "96px Arial,Serif";

    /**
     * The font that is used for our informative text.
     */
    const INFO_FONT = "32px Arial,Serif";

    /**
     * The font that is used to display our menu text.
     */
    const MENU_FONT = "40px Arial,Serif";

    /**
     * This class represents the title screen. It allows the user to select the level that the game will
     * be played at.
     */
    export class TitleScreen extends Scene
    {
        /**
         * As a supreme hack, redefine the property that defines our renderer so
         * that the compiler knows that it is a canvas renderer. This allows us
         * to get at its context so we can do things outside of what the current
         * API allows for without having to noodle with the API more.
         */
        protected _renderer : CanvasRenderer;

        /**
         * The list of menu items that we display to the user.
         */
        private _menu : Menu;

        /**
         * The number of rounds we think the game should start with; 0 means a
         * short game, 1 is a regular game, 3 is a long game.
         */
        private _totalRounds : number;

        /**
         * Construct the title screen scene.
         *
         * @param stage the stage that controls us
         */
        constructor (stage : Stage)
        {
            // Let the super do some setup
            super ("titleScreen", stage);

            // Set up our menu.
            this._menu = new Menu (stage, "Arial,Serif", 40);
            this._menu.addItem ("Game type: Short", new Point (150, 400));
            this._menu.addItem ("Start Game", new Point (150, 450));

            // Make sure it gets render and update requests.
            this.addActor (this._menu);

            // default level.
            this._totalRounds = 0;
        }

        /**
         * Get the name for the type of game that has the current number of
         * rounds we're currently set to.
         *
         * @returns {string} the game type for this number of rounds.
         */
        private gameTypeForRounds () : string
        {
            switch (this._totalRounds)
            {
                case 0:
                    return "Short";

                case 1:
                    return "Normal";

                default:
                    return "Long";
            }
        }
        /**
         * This helper updates our menu to show what the currently selected level is.
         */
        private updateMenu () : void
        {
            let item = this._menu.getItem (0);
            if (item)
                item.text = "Game type: " + this.gameTypeForRounds ();
        }

        /**
         * Render the name of the game to the screen.
         */
        private renderTitle () : void
        {
            this._renderer.translateAndRotate (this._stage.width / 2, 45);

            // Set the font and indicate that the text should be centered in both directions.
            this._renderer.context.font = TITLE_FONT;
            this._renderer.context.textAlign = "center";
            this._renderer.context.textBaseline = "middle";

            // Draw the text and restore the context.
            this._renderer.drawTxt ("A-Maze-Balls", 0, 0, 'white');
            this._renderer.restore ();
        }

        /**
         * Render our info text to the screen.
         */
        private renderInfoText () : void
        {
            // The info text that we generate to the screen to explain what we are.
            const infoText = [
                "A simple Bolo Ball clone",
                "",
                "Coded during #devember 2016 by Terence Martin",
                "for game development practice",
                "",
                "Feel free to use this code as you see fit. See the",
                "LICENSE file for details"
            ];

            // Save the context state and then set our font and vertical font alignment.
            this._renderer.translateAndRotate (TILE_SIZE, 132);
            this._renderer.context.font = INFO_FONT;
            this._renderer.context.textBaseline = "middle";

            // Draw the text now
            for (let i = 0, y = 0 ; i < infoText.length ; i++, y += TILE_SIZE)
                this._renderer.drawTxt (infoText[i], 0, y, '#c8c8c8');

            // We can restore now.
            this._renderer.restore ();
        }

        /**
         * Invoked to render us. We clear the screen, show some intro text, and we allow the user to
         * select a starting level.
         */
        render () : void
        {
            // Clear the screen and render all of our text.
            this._renderer.clear ('black');
            this.renderTitle ();
            this.renderInfoText ();

            // Now let the super draw everything else, including our menu
            super.render ();
        }

        /**
         * Start a new game using the currently set total number of rounds.
         */
        private startGame () : void
        {
            // First, set up for a new game of a set number of levels. Due to
            // the hacky nature of this, the short and normal games have the
            // right number of rounds, but the long game has 2 rounds instead of
            // 3 due to design decisions made not by me.
            newGame (this._totalRounds != 2 ? this._totalRounds : 3);
            this._stage.switchToScene ("game");
        }

        /**
         * Triggers on a key press
         *
         * @param eventObj key event object
         * @returns {boolean} true if we handled the key or false otherwise.
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // If the super handles the key, we're done.
            if (super.inputKeyDown (eventObj))
                return true;

            switch (eventObj.keyCode)
            {
                // Previous menu selection (wraps around)
                case KeyCodes.KEY_UP:
                    this._menu.selectPrevious ();
                    return true;

                // Next menu selection (wraps around)
                case KeyCodes.KEY_DOWN:
                    this._menu.selectNext ();
                    return true;

                // Change the game type
                case KeyCodes.KEY_LEFT:
                    if (this._menu.selected == 0)
                    {
                        if (this._totalRounds > 0)
                        {
                            this._totalRounds--;
                            this.updateMenu ();
                        }
                        return true;
                    }
                    return false;

                // Change the game type.
                case KeyCodes.KEY_RIGHT:
                    if (this._menu.selected == 0)
                    {
                        if (this._totalRounds < 2)
                        {
                            this._totalRounds++;
                            this.updateMenu ();
                        }
                        return true;
                    }
                    return false;

                // Select the current menu item; on level increase it, on start
                // game, do that.
                case KeyCodes.KEY_ENTER:
                    if (this._menu.selected == 0)
                    {
                        this._totalRounds++;
                        if (this._totalRounds > 2)
                            this._totalRounds = 0;
                        this.updateMenu ();
                        return true;
                    }
                    else
                    {
                        this.startGame ();
                        return true;
                    }
            }

            // Not handled.
            return false;
        }
    }
}
