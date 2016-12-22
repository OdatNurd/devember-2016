module nurdz.game
{
    /**
     * This scene represents the game screen, where the game will actually be
     * played.
     */
    export class GameScene extends Scene
                           implements StateMachineChangeListener,
                                      MazeEventListener
    {
        /**
         * Our state machine; this controls what we're doing at any given time.
         */
        private _state : StateMachine;

        /**
         * The maze, which holds most of the game entities.
         */
        private _maze : Maze;

        /**
         * The entity that represents the human player.
         */
        private _player : Player;

        /**
         * The entity that represents the computer player.
         */
        private _computer : Player;

        /**
         * The debugger for our maze. We store a reference to make access easier.
         */
        private _debugger : MazeDebugger;

        /**
         * The last known position of the mouse on the stage.
         */
        private _mouse : Point;

        /**
         * Get the current state of the game.
         *
         * This directly returns the state of our state machine object.
         *
         * @returns {GameState} the current state of our state machine
         */
        get state () : GameState
        { return this._state.state; }

        /**
         * Change the current state of the game to a new state.
         *
         * This directly sets the state of our state machine object.
         *
         * @param {GameState} newState the new state to switch to
         */
        set state (newState : GameState)
        { this._state.state = newState; }

        /**
         * Get the state that we were in prior to the current state.
         *
         * This directly returns the prior state of our state machine object.
         *
         * @returns {GameState} the previous state of our state machine
         */
        get priorState () : GameState
        { return this._state.priorState; }

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

            // Create the state machine that drives us and register our interest
            // in knowing when the state inside it changes.
            this._state = new StateMachine ();
            this._state.addListener (this);

            // Create the maze that holds most of our game state and tell it
            // that we are interested in when game related events trigger.
            this._maze = new Maze (stage);
            this._maze.listener = this;

            // Now create the player and the computer player objects and set
            // the position of each of them to be the first column in the map
            // and their visibility state to hidden.
            this._player = new Player (stage, PlayerType.PLAYER_HUMAN);
            this._player.mapPosition.setToXY (1, 0);
            this._player.visible = false;
            this._computer = new Player (stage, PlayerType.PLAYER_COMPUTER);
            this._computer.mapPosition.setToXY (1, 0);
            this._computer.visible = false;

            // The computer player needs a handle to the maze so that it can
            // determine what moves to make.
            this._computer.maze = this._maze;

            // Add all of our child entities so that they update and render.
            this.addActor (this._maze);
            this.addActor (this._player);
            this.addActor (this._computer);

            // Start out with a default mouse location.
            this._mouse = new Point (0, 0);

            // Stash the debugger.
            this._debugger = this._maze.debugger;
        }

        /**
         * This is invoked when we are becoming the current scene.
         *
         * We use this to know that our preload is finished and do any handling
         * that needs to be done in that instance.
         *
         * @param {Scene} previousScene the scene that was active before us
         */
        activating (previousScene : Scene) : void
        {
            // Let the super work its magic.
            super.activating (previousScene);

            // Set the reference position of the player and computer entities
            // to that of the maze, shifted up some cell so that they appear in
            // the virtual cell on top of the maze.
            this._player.referencePoint = this._maze.position.copyTranslatedXY (0, -this._maze.cellSize);
            this._computer.referencePoint = this._maze.position.copyTranslatedXY (0, -this._maze.cellSize);

            // If there is no current state, it's time to generate a new level.
            if (this.state == GameState.NO_STATE)
                this.state = GameState.MAZE_GENERATION;
        }

        /**
         * Modify the passed in player to either turn to face the direction that
         * is provided or, if they are already facing that direction, walk in
         * that direction (if possible).
         *
         * This will work for either a computer or player controlled Player
         * instance in any facing.
         *
         * @param {Player}          player    the player entity to turn or move
         * @param {PlayerDirection} direction the direction to turn or move in
         */
        private playerTurnOrMove (player : Player, direction : PlayerDirection)
        {
            // If the player is not facing in the direction provided, then
            // turn them and leave.
            if (player.playerDirection != direction)
            {
                player.turnTo (direction);
                return;
            }

            // We're facing in the appropriate direction, so see if we should
            // move or not.
            switch (direction)
            {
                case PlayerDirection.DIRECTION_RIGHT:
                    if (this._player.mapPosition.x < MAZE_WIDTH - 2)
                        this._player.moveBy (1);
                    break;

                case PlayerDirection.DIRECTION_LEFT:
                    if (player.mapPosition.x > 1)
                        player.moveBy (-1);
                    break;

                // Can't move in this direction
                case PlayerDirection.DIRECTION_DOWN:
                    break;

            }
        }

        /**
         * This is invoked by inputKeyDown to handle input directly related to
         * the player and their ability to move their avatar or make a move.
         *
         * The commands here may be ignored based on the current state of the
         * game, so that input is not applied inappropriately. The return value
         * is true when the event was handled and false when it was not.
         *
         * @param   {KeyboardEvent} eventObj the keyboard event that says what
         * key was pressed
         *
         * @returns {boolean}                true if we handled the key, false
         * otherwise.
         */
        private handlePlayerKey (eventObj : KeyboardEvent) : boolean
        {
            // If our current state does not indicate that it is the player's
            // turn, then do nothing.
            if (this.state != GameState.PLAYER_TURN)
                return false;

            // See if it's something else we care about.
            switch (eventObj.keyCode)
            {
                // Rotate the player to face left or walk left.
                case KeyCodes.KEY_LEFT:
                    this.playerTurnOrMove (this._player, PlayerDirection.DIRECTION_LEFT);
                    return true;

                // Rotate the player to face right or walk right.
                case KeyCodes.KEY_RIGHT:
                    this.playerTurnOrMove (this._player, PlayerDirection.DIRECTION_RIGHT);
                    return true;

                // Rotate the player to face down.
                case KeyCodes.KEY_DOWN:
                    this.playerTurnOrMove (this._player, PlayerDirection.DIRECTION_DOWN);
                    return true;

                // Run the push animation in the current facing direction.
                case KeyCodes.KEY_SPACEBAR:
                    this._player.push ();

                    // If the player is facing down, then try to actually push
                    // the ball.
                    if (this._player.playerDirection == PlayerDirection.DIRECTION_DOWN)
                        this._maze.pushBall (this._player.mapPosition.x);
                    return true;

                // The question mark key; this is not in ts-game-engine yet.
                case 191:
                    // Get the AI to select a ball. If one was selected, jump
                    // the player to that position, turn to face it, and push.
                    // The push might not work if we're not already facing down,
                    // but that's OK.
                    let ball = AI_selectBestMove (this._maze);
                    if (ball != null)
                    {
                        this._player.jumpTo (ball.mapPosition.x);
                        this._player.turnTo (PlayerDirection.DIRECTION_DOWN);
                        this._player.push ();
                    }
                    return true;

                // We don't handle any other keys.
                default:
                    return false;
            }
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
            // handle it and we'll just leave.
            if (super.inputKeyDown (eventObj))
                return true;

            // If this is a player key and it was handled, then we can leave
            // now.
            if (this.handlePlayerKey (eventObj))
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
                case KeyCodes.KEY_F12:
                    this._debugger.debugTracking = !this._debugger.debugTracking;
                    if (this._debugger.debugTracking)
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
                    return this._debugger.debugClearCell ();

                // Toggle the type of the entity under the debug cursor through
                // its various states.
                case KeyCodes.KEY_T:
                    return this._debugger.debugToggleCell ();

                // Add a brick to the maze at the current debug cursor; this
                // only works if the cell is currently empty. This will try
                // to add a gray brick, and failing that a bonus brick.
                case KeyCodes.KEY_B:
                    return this._debugger.debugAddBrick ();

                // Add an arrow to the maze at the current debug cursor; this
                // only works if the cell is currentlye empty. This will add a
                // normal arrow by default, but this can be toggled with the
                // 'T" key'.
                case KeyCodes.KEY_A:
                    return this._debugger.debugAddArrow ();

                // Add a teleport to the maze at the current debug cursor; this
                // only works if the cell is currentlye empty. This just adds an
                // extra exit point to the black hole system.
                case KeyCodes.KEY_H:
                    return this._debugger.debugAddTeleport ();

                // Add a ball to the maze at the current debug cursor; this only
                // works if the cell is currently empty. This will add a player
                // ball by default, but this can be toggled with the 'T' key.
                case KeyCodes.KEY_L:
                    return this._debugger.debugAddBall ();

                // Vanish away all of the gray or bonus bricks that are still
                // visible.
                case KeyCodes.KEY_V:
                case KeyCodes.KEY_C:
                    return this._debugger.debugVanishBricks (eventObj.keyCode == KeyCodes.KEY_V);

                // Wipe the entire maze contents; this is like a reset except
                // no new maze is generated first.
                case KeyCodes.KEY_W:
                    return this._debugger.debugWipeMaze ();

                // For debugging purposes, this key swaps to human balls
                case KeyCodes.KEY_Z:
                    console.log ("human balls");
                    this._maze.contents.visibleBallType = PlayerType.PLAYER_HUMAN;
                    return true;

                // For debugging purposes, this key swaps to computer balls.
                case KeyCodes.KEY_X:
                console.log ("computer balls");
                    this._maze.contents.visibleBallType = PlayerType.PLAYER_COMPUTER;
                    return true;
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

        /**
         * This gets invoked by our maze entity when it has finished generating
         * a maze. We use this to switch the state so that the game can start.
         */
        mazeGenerationComplete () : void
        {
            // For now, after maze generation it is always the human player's
            // turn.
            this.state = GameState.PLAYER_TURN;
        }

        /**
         * This gets invoked when either the player or the computer has selected
         * a ball to push and told the maze to push it, and the maze has decided
         * that this is allowed and it is about to drop the ball.
         *
         * We get told what ball is currently being dropped. We can determine
         * who pushed the ball by the current state.
         *
         * @param {Ball} ball the ball entity that is being pushed.
         */
        startBallPush (ball : Ball) : void
        {
            // Set the state to indicate that a ball is being dropped.
            this.state = GameState.BALL_DROPPING;
        }

        /**
         * A ball drop that was in progress has now finished. The event features
         * the ball that was dropped and also an indication as to whether the
         * ball reached the goal or not.
         *
         * This gets triggered once the ball comes to a rest and before it is
         * vanished away (if it should be).
         *
         * @param {Ball}    ball        the ball that stopped dropping
         * @param {boolean} reachedGoal true if the ball reached the goal, false
         * if it stopped in the maze somewhere.
         */
        ballDropComplete (ball : Ball, reachedGoal : boolean) : void
        {
            // Did the ball reach the goal? This is good enough for testing.
            if (reachedGoal)
                console.log ("GOOOOOAL!");

            // Now that the ball is done, where we go depends on where we came
            // from.
            switch (this.priorState)
            {
                // If it was the players turn before the ball started dropping,
                // it is the computers turn now.
                case GameState.PLAYER_TURN:
                    this.state = GameState.COMPUTER_TURN;
                    break;

                // If it was the computers turn before the ball started
                // dropping, it is the players turn now.
                case GameState.COMPUTER_TURN:
                    this.state = GameState.PLAYER_TURN;
                    break;

                // If we get here, we don't know.
                default:
                    console.log ("DEBUG: Do not know how to get to the next state from here");
                    break;
            }
        }

        /**
         * This gets triggered every time our state machine gets put into a new
         * state.
         *
         * WARNING: All hell (probably) breaks loose if this method immediately
         * changes the state of the machine that was passed in, so maybe don't
         * do that?
         *
         * @param {StateMachine} machine  the machine whose state changed
         * @param {GameState}    newState the newly set state
         */
        stateChanged (machine : StateMachine, newState : GameState) : void
        {
            // Record the stat change.
            console.log ("DEBUG: State changed to: " + GameState[newState]);

            switch (newState)
            {
                // We are supposed to be generating a maze, so do that now.
                case GameState.MAZE_GENERATION:
                    this._maze.generateMaze ();
                    break;

                // It is now the turn of the human player, so make sure that
                // they are visible and the computer is not.
                case GameState.PLAYER_TURN:
                    this._player.visible = true;
                    this._computer.visible = false;
                    if (this._maze.contents.visibleBallType != PlayerType.PLAYER_HUMAN)
                        this._maze.contents.swapVisibleBalls ();
                    break;

                // It is now the turn of the computer player, so make sure that
                // they are visible and the player is not.
                case GameState.COMPUTER_TURN:
                    this._computer.visible = true;
                    this._player.visible = false;
                    if (this._maze.contents.visibleBallType != PlayerType.PLAYER_COMPUTER)
                        this._maze.contents.swapVisibleBalls ();

                    // Tell the computer that they're starting their turn now.
                    // this._computer.ai_startingTurn ();
                    break;
            }
        }
    }
}
