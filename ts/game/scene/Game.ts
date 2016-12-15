module nurdz.game
{
    /**
     * This scene represents the game screen, where the game will actually be
     * played.
     */
    export class GameScene extends Scene
    {
        /**
         * The maze, which holds most of the game entities.
         */
        private _maze : Maze;

        /**
         * The last known position of the mouse on the stage.
         */
        private _mouse : Point;

        /**
         * Construct a new game screen scene that will display on the provided
         * stage.
         *
         * This scene type represents the core of the game; it manages all of
         * the game entities required to play the game as well as the controls
         * and interactions between them.
         *
         * @param stage the stage the scene will present on
         *
         * @constructor
         */
        constructor (stage : Stage)
        {
            // Create the scene via our super class.
            super ("gameScreen", stage);

            // Create a maze and add it to the scene so we can see how it
            // renders itself.
            this._maze = new Maze (stage);
            this.addActor (this._maze);

            // Start out with a default mouse location.
            this._mouse = new Point (0, 0);
        }

        /**
         * Invoked every time a key is pressed on the game screen
         *
         * @param   {KeyboardEvent} eventObj the keyboard event that says what
         * key was pressed
         *
         * @returns {boolean}                true if we handled the key, false
         * otherwise
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // If this is a key the super class knows how to handle, then let it
            // handle it and we'll jus leave.
            if (super.inputKeyDown (eventObj))
                return true;

            // See if it's something else we care about.
            switch (eventObj.keyCode)
            {
                // For the F key, toggle between full screen mode and windowed
                // mode.
                case KeyCodes.KEY_F:
                    this._stage.toggleFullscreen();
                    return true;

                // Trigger a new maze generation.
                case KeyCodes.KEY_G:
                    this._maze.generateMaze ();
                    return true;

                // Toggle mouse tracking of the debug location, then update the
                // tracking with the last known mouse location.
                case KeyCodes.KEY_SPACEBAR:
                    this._maze.debugger.debugTracking = !this._maze.debugger.debugTracking;
                    if (this._maze.debugger.debugTracking)
                        this._maze.setDebugPoint (this._mouse);
                    return true;

                // Delete the contents of the current cell, if anything is
                // there.
                //
                // These correspond to Backspace and Delete respectively; the
                // engine does not have a code for these yet. Note that the
                // delete key on the numeric keypad may or may not work.
                case 8:
                case 46:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugClearCell ();
                        return true;
                    }
                    break;

                // Toggle the type of the entity under the debug cursor through
                // its various states.
                case KeyCodes.KEY_T:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugToggleCell ();
                        return true;
                    }
                    break;

                // Add a brick to the maze at the current debug cursor; this
                // only works if the cell is currently empty. This will try
                // to add a gray brick, and failing that a bonus brick.
                case KeyCodes.KEY_B:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugAddBrick ();
                        return true;
                    }
                    break;

                // Add an arrow to the maze at the current debug cursor; this
                // only works if the cell is currentlye empty. This will add a
                // normal arrow by default, but this can be toggled with the
                // 'T" key'.
                case KeyCodes.KEY_A:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugAddArrow ();
                        return true;
                    }
                    break;

                // Add a teleport to the maze at the current debug cursor; this
                // only works if the cell is currentlye empty. This just adds an
                // extra exit point to the black hole system.
                case KeyCodes.KEY_H:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugAddTeleport ();
                        return true;
                    }
                    break;

                // Add a ball to the maze at the current debug cursor; this only
                // works if the cell is currently empty. This will add a player
                // ball by default, but this can be toggled with the 'T' key.
                case KeyCodes.KEY_L:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugAddBall ();
                        return true;
                    }
                    break;

                // Vanish away all of the gray or bonus bricks that are still
                // visible.
                case KeyCodes.KEY_V:
                case KeyCodes.KEY_C:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugVanishBricks (eventObj.keyCode == KeyCodes.KEY_V);
                        return true;
                    }
                    break;

                // Wipe the entire maze contents; this is like a reset except
                // no new maze is generated first.
                case KeyCodes.KEY_W:
                    if (this._maze.debugger.debugTracking)
                    {
                        this._maze.debugger.debugWipeMaze ();
                        return true;
                    }
                    break;
            }

            // We did not handle it
            return false;
        }

        /**
         * This gets triggered while the game is running and the user clicks the
         * mouse in the scene.
         *
         * The method should return true if the mouse event was handled or false
         * if it was not. The Stage will prevent the default handling for all
         * mouse events that are handled.
         *
         * @param eventObj the event object
         *
         * @returns {boolean} true if the mouse event was handled, false
         * otherwise
         */
        inputMouseClick (eventObj : MouseEvent) : boolean
        {
            // Calculate where on the stage the mouse clicked. If this is inside
            // of the maze, localize the point to the bounds of the maze and
            // have the maze handle it.
            let mousePos = this._stage.calculateMousePos (eventObj);
            if (this._maze.contains (mousePos))
            {
                let pos = this._maze.position;
                return this._maze.handleClick (mousePos.translateXY (-pos.x, -pos.y));
            }

            return false;
        }

        /**
         * This is triggered whenever the mouse is moved over the canvas.
         *
         * @param eventObj the event that represents the mouse movement.
         * @returns {boolean} true if we handled this event or false if not.
         */
        inputMouseMove (eventObj : MouseEvent) : boolean
        {
            // Get the current mouse position, and then update tracking with it.
            this._mouse = this._stage.calculateMousePos (eventObj, this._mouse);

            // If we're tracking a debug location, tell the maze about this
            // point.
            if (this._maze.debugger.debugTracking)
                this._maze.setDebugPoint (this._mouse);

            // We handled it.
            return true;
        }


        /**
         * This is invoked every frame to render the current scene to the stage.
         */
        render () : void
        {
            // Clear the screen, then let our super render for us so that all
            // entities get painted.
            this._renderer.fillRect (0, 0, this._stage.width, this._stage.height, '#000');
            super.render ();
        }
    }
}
