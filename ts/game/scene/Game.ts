module nurdz.game
{
    /**
     * When we are in the state that we're removing blocked balls from the maze,
     * this is the delay (in ticks) for telling the next ball when it should
     * start to vanish.
     */
    const ROUND_BALL_VANISH_TIME = 3;

    /**
     * When we are in the state that we're removing gray bricks from the maze,
     * this is the delay (in ticks) for telling the next brick when it should
     * start to vanish.
     */
    const ROUND_BRICK_VANISH_TIME = 2;

    /**
     * This scene represents the game screen, where the game will actually be
     * played.
     */
    export class Game extends Scene
                      implements StateMachineChangeListener,
                                 MazeEventListener
    {
        /**
         * Override the type of our renderer to be a canvas renderer.
         */
        protected _renderer : CanvasRenderer;

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
         * The billboard that we use to tell the player what's happening as we
         * change states. This can be hidden or displayed with any text we want.
         */
        private _billboard : Billboard;

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

            // Create the billboard. It starts with no text and hidden. It takes
            // care to only render itself when visible.
            this._billboard = new Billboard (stage, "kenvector_futureregular", 20);

            // Add all of our child entities so that they update and render.
            this.addActor (this._maze);
            this.addActor (this._player);
            this.addActor (this._computer);
            this.addActor (this._billboard);

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

            // Set up what our font should be while this screen is active.
            this._renderer.context.font = '30px kenvector_futureregular';

            // Set the reference position of the player and computer entities
            // to that of the maze, shifted up some cell so that they appear in
            // the virtual cell on top of the maze.
            this._player.referencePoint = this._maze.position.copyTranslatedXY (0, -this._maze.cellSize);
            this._computer.referencePoint = this._maze.position.copyTranslatedXY (0, -this._maze.cellSize);

            // When we become active, we're always going to start a new game,
            // so make sure that the maze is clear, our player entities are
            // hidden, and then set our state to the begin round state.
            this._player.visible = false;
            this._computer.visible = false;
            this._maze.resetMazeEntities ();
            this._maze.generator.emptyMaze ();
            this.state = GameState.BEGIN_ROUND;
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

                // When the player presses the L key, we swap to showing the
                // computer balls instead of the player balls. We also swap to
                // a new state whose purposes is to make sure that we can only
                // come back to this state and block player movement in the
                // interim.
                case KeyCodes.KEY_L:
                    // If the debugger wants to add a ball, then do that now
                    // instead of the usual handling.
                    if (this._debugger.debugAddBall () == true)
                        return true;

                    this._maze.contents.showComputerBalls ();
                    this.state = GameState.PLAYER_VIEW_COMPUTER_BALLS;
                    return true;

                // The question mark key; this is not in ts-game-engine yet.
                case 191:
                    // If we're in debugging mode, don't handle the key here and
                    // let the debug code handle it instead.
                    if (this._debugger.debugTracking)
                        return false;

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
                    if (this._debugger.debugTracking)
                    {
                        this._maze.generateMaze ();
                        return true;
                    }
                    return false;

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
                // only works if the cell is currently empty. This will add a
                // normal arrow by default, but this can be toggled with the
                // 'T" key'.
                case KeyCodes.KEY_A:
                    return this._debugger.debugAddArrow ();

                // Add a teleport to the maze at the current debug cursor; this
                // only works if the cell is currently empty. This just adds an
                // extra exit point to the black hole system.
                case KeyCodes.KEY_H:
                    return this._debugger.debugAddTeleport ();

                // If we are viewing the computer balls, swap back to player
                // balls and re-enable the player controls. Otherwise this key
                // will add a ball if we're in debug mode.
                case KeyCodes.KEY_L:
                    // If we are in the view computer ball state, then swap back
                    // to player balls and reset the state back to the player
                    // turn so that they can move again.
                    if (this.state == GameState.PLAYER_VIEW_COMPUTER_BALLS)
                    {
                        this._maze.contents.showPlayerBalls ();
                        this.state = GameState.PLAYER_TURN;
                        return true;
                    }

                    // Not viewing the computer balls, so maybe add a ball?
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

                // The question mark key; this is not in ts-game-engine yet.
                case 191:
                    return this._debugger.debugShowContents ();
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
            if (this._debugger.debugTracking)
                this._maze.setDebugPoint (this._mouse);

            // We handled it.
            return true;
        }

        /**
         * This is invoked once per update loop while this scene is the active
         * scene
         *
         * @param {number} tick the game tick; this is a count of how many times
         * the game loop has executed
         */
        update (tick : number) : void
        {
            // Let the super do it's business, which updates all of our registered
            // actors.
            super.update (tick);

            // Update the state machine tick and then handle our state logic for
            // this update.
            this._state.update (tick);
            this.stateLogic ();
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

            // Now render the score.
            renderScores (this._renderer);
        }

        /**
         * This gets invoked by our maze entity when it has finished generating
         * a maze. We use this to switch the state so that the game can start.
         */
        mazeGenerationComplete () : void
        {
            // Skip to the state were we select what player will start the
            // game.
            this.state = GameState.SELECT_START_PLAYER;
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
         * the ball that was dropped.
         *
         * This gets triggered once the ball comes to a rest and before it is
         * vanished away (if it should be).
         *
         * This is triggered for any ball drop; human or computer, during the
         * regular game or as the final ball drop.
         *
         * The owner of the ball can be determined from the ball entity itself
         * while isFinal tells you if the ball finished dropping as part of a
         * regular or final ball drop.
         *
         * @param {Ball}    ball    the ball that stopped dropping
         * @param {boolean} isFInal true if this ball was part of a final ball
         * drop
         */
        ballDropComplete (ball : Ball, isFinal : boolean) : void
        {
            // Did the ball reach the goal?
            if (ball.mapPosition.y == MAZE_HEIGHT - 2)
                goalBallScore (ball);

            // The ball did not reach the goal, but if this is a final ball drop
            // then score partial points for the ending position of the ball.
            else if (isFinal == true)
                partialBallScore (ball);

            // Now that the ball is done, where we go depends on where we came
            // from.
            switch (this.priorState)
            {
                // If it was the players turn before the ball started dropping,
                // it is the computers turn now.
                case GameState.PLAYER_TURN:
                    this.state = GameState.CHECK_VALID_PLAY_COMPUTER;
                    break;

                // If it was the computers turn before the ball started
                // dropping, it is the players turn now.
                case GameState.COMPUTER_TURN:
                    this.state = GameState.CHECK_VALID_PLAY_PLAYER;
                    break;

                // If we were doing the final ball drop before, go back there
                // now.
                case GameState.FINAL_BALL_DROP:
                    this.state = GameState.FINAL_BALL_DROP;
                    break;

                // If we get here, we don't know.
                default:
                    console.log ("DEBUG: Do not know how to get to the next state from here");
                    break;
            }
        }

        /**
         * A ball that is blocked has been told that it's being removed from
         * the maze during the final part of the round just prior to the gray
         * bricks being removed and the final ball drop.
         *
         * This gets triggered once the ball has been told to vanish away but
         * before the vanish starts.
         *
         * This is triggered for both human and computer balls.
         *
         * @param {Ball} ball the ball that being removed
         */
        blockedBallRemoved (ball : Ball) : void
        {
            // This is a blocked ball that can no longer move, so apply a
            // partial score value now.
            partialBallScore (ball);
            lerpBallToScore (ball);
        }

        /**
         * The Maze is telling us that it is now empty of gray bricks because it
         * has just reaped the last fully hidden gray brick.
         *
         * This triggers the start of the final ball drop.
         */
        grayBrickRemovalComplete () : void
        {
            // Swap states to the start of the final ball drop.
            this.state = GameState.BEGIN_FINAL_DROP;
        }

        /**
         * This gets triggered every time our state machine gets put into a new
         * state.
         *
         * This is used to handle state logic that only needs to happen one
         * time, when the state actively changes into a new state. All other
         * state logic happens in the stateLogic() method below. This allows us
         * to handle simple 1 time logic without requiring a boolean to flag
         * if we have done it or not.
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
                // We are entering a new round. Display the round number if the
                // game is not over. This is the state that determines the game
                // over state.
                case GameState.BEGIN_ROUND:
                    // Display text for this round, if the game is not over.
                    if (isGameOver () == false)
                        this._billboard.show ("Round " + currentRound);
                    break;

                // We need to select a player to start off this round. Here we
                // just randomly select one. The appropraite state is stored in
                // the next state property and we just display a billboard here.
                case GameState.SELECT_START_PLAYER:
                    if (Utils.randomIntInRange (1, 100) % 2 == 0)
                    {
                        this._state.nextState = GameState.CHECK_VALID_PLAY_PLAYER;
                        this._billboard.show ("Human Starts");
                    }
                    else
                    {
                        this._state.nextState = GameState.CHECK_VALID_PLAY_COMPUTER;
                        this._billboard.show ("Computer Starts");
                    }
                    break;

                // We are supposed to be generating a maze, so do that now.
                case GameState.MAZE_GENERATION:
                    this._maze.generateMaze ();
                    break;

                // It is now the turn of the human player, so make sure that
                // they are visible and the computer is not.
                case GameState.PLAYER_TURN:
                    this._player.visible = true;
                    this._computer.visible = false;
                    this._maze.contents.showPlayerBalls ();
                    break;

                // It is now the turn of the computer player, so make sure that
                // they are visible and the player is not.
                case GameState.COMPUTER_TURN:
                    this._computer.visible = true;
                    this._player.visible = false;
                    this._maze.contents.showComputerBalls ();

                    // Tell the computer that they're starting their turn now.
                    this._computer.ai_startingTurn ();
                    break;

                // When we are entering the state for removing all blocked
                // balls, make sure that the maze contents discards all unplayed
                // balls so that they visually leave the screen.
                case GameState.REMOVE_BLOCKED_BALLS:
                    this._maze.contents.clearUnplayedBalls (true);
                    this._billboard.show ("Removing Balls");
                    break;

                // When we are entering the state for removing all gray bricks,
                // display a billboard to let the player know.
                case GameState.REMOVE_GRAY_BRICKS:
                    this._billboard.show ("Removing Bricks");
                    break;

                // We are getting ready to start the final ball drop, so first
                // display a billboard. This has to happen in a different state
                // because the code transitions back to the FINAL_BALL_DROP
                // state after every ball it drops.
                case GameState.BEGIN_FINAL_DROP:
                    this._billboard.show ("Final Drop");
                    break;

                // When we enter the final ball drop, hide the player and
                // computer characters.
                case GameState.FINAL_BALL_DROP:
                    this._player.visible = false;
                    this._computer.visible = false;
                    break;

                // The game is over, so swap to that scene now.
                case GameState.GAME_OVER:
                    this._stage.switchToScene ("gameOver");
                    break;

            }
        }

        /**
         * This method is used to handle all of the ongoing state logic; logic
         * that needs to be checked every update loop to handle something while
         * inside of a particular state.
         *
         * For logic that applies only when the state is initially changed to a
         * new state, see the stateChanged() method. This allows us to handle
         * such logic without requiring a bunch of sentinel boolean values to
         * flag that it has been done.
         */
        private stateLogic () : void
        {
            // Handle based on state.
            switch (this.state)
            {
                // It is the start of a new round; if the game is over now,
                // switch to the game over state. Otherwise, we can swap to the
                // maze generation state for this round.
                case GameState.BEGIN_ROUND:
                    // If the game is over, swap to the game over state and
                    // stop. Nothing else to do here.
                    if (isGameOver ())
                    {
                        this.state = GameState.GAME_OVER;
                        break;
                    }

                    // THe game is not over, so we're display the round number
                    // in a billboard. When enough time has passed, we can
                    // start the game by generating the maze.
                    if (this._state.hasElapsed (60))
                    {
                        this._billboard.hide ();
                        this._player.jumpTo (1);
                        this._computer.jumpTo (MAZE_WIDTH - 1);
                        this.state = GameState.MAZE_GENERATION;
                    }
                    break;

                // If we have displayed the billboard long enough, hide it and
                // start the game now.
                case GameState.SELECT_START_PLAYER:
                    if (this._state.hasElapsed (60))
                    {
                        this._billboard.hide ();
                        this.state = this._state.nextState;
                    }
                    break;

                // It is becoming the player's turn; check to see if there is
                // a valid play for them; if yes, make it their turn. Otherwise,
                // make it the computer turn.
                case GameState.CHECK_VALID_PLAY_PLAYER:
                    if (this._maze.contents.hasPlayableHumanBall ())
                        this.state = GameState.PLAYER_TURN;
                    else
                    {
                        // If there is a computer ball to play, make it the
                        // computer's turn. Otherwise, time to do the final ball
                        // drop.
                        if (this._maze.contents.hasPlayableComputerBall ())
                            this.state = GameState.COMPUTER_TURN;
                        else
                            this.state = GameState.REMOVE_BLOCKED_BALLS;
                    }
                    break;

                // It is becoming the computer's turn; check to see if there is
                // a valid play for them; if yes, make it their tun. Otherwise
                // make it the player's turn.
                case GameState.CHECK_VALID_PLAY_COMPUTER:
                    if (this._maze.contents.hasPlayableComputerBall ())
                        this.state = GameState.COMPUTER_TURN;
                    else
                    {
                        // If there is a player ball to play, make it the
                        // player's turn. Otherwise, time to do the final ball
                        // drop.
                        if (this._maze.contents.hasPlayableHumanBall ())
                            this.state = GameState.PLAYER_TURN;
                        else
                            this.state = GameState.REMOVE_BLOCKED_BALLS;
                    }
                    break;

                // When we are in the remove blocked balls state, use the state
                // timer to remove a blocked ball every so often, until we
                // determine that there are none left.
                case GameState.REMOVE_BLOCKED_BALLS:
                    // If we have not been in this state long enough yet,
                    // do nothing.
                    if (this._state.hasElapsed (60) == false)
                        break;

                    // We can (probably redundantly) hide the billboard now.
                    this._billboard.hide ();

                    // We have waited long enough, so every so often remove
                    // another ball.
                    if (this._state.timerTrigger (ROUND_BALL_VANISH_TIME))
                    {
                        // Try to remove a ball; this returns false when there
                        // are no more balls to remove AND all balls we were
                        // waiting for are now gone.
                        if (this._maze.removeNextBlockedBall () == false)
                            this.state = GameState.REMOVE_GRAY_BRICKS;
                    }
                    break;

                // When we are in the remove gray bricks state, use the state
                // timer to remove a brick every so often.
                case GameState.REMOVE_GRAY_BRICKS:
                    // If we have not been in this state long enough yet,
                    // do nothing.
                    if (this._state.hasElapsed (60) == false)
                        break;

                    // We can (probably redundantly) hide the billboard now.
                    this._billboard.hide ();

                    // We have waited long enough, so every so often remove
                    // another brick.
                    if (this._state.timerTrigger (ROUND_BRICK_VANISH_TIME))
                    {
                        // If there is no brick to remove, trigger the state
                        // change right away.
                        if (this._maze.removeNextGrayBrick () == false)
                            this.grayBrickRemovalComplete ();
                    }
                    break;

                // We are going to start the final ball drop in the game.
                // Here we are just waiting for the player to have time to read
                // the billboard.
                case GameState.BEGIN_FINAL_DROP:
                    // If we have not been in this state long enough yet,
                    // do nothing.
                    if (this._state.hasElapsed (60) == false)
                        break;

                    // Hide the billboard and switch to the final drop state
                    // to get things rolling (well, dropping).
                    this._billboard.hide ();
                    this.state = GameState.FINAL_BALL_DROP;
                    break;

                // We are dropping the final balls through the maze now. Select
                // one and drop it; if there are none left to drop, set the
                // state to the game over state.
                //
                // When a ball is successfully started dropping using this
                // method the state is changed to the dropping ball state
                // automatically.
                case GameState.FINAL_BALL_DROP:
                    if (this._maze.dropNextFinalBall () == false)
                        this.state = GameState.END_ROUND;
                    break;

                // It's the end of the round; go to the next round and then skip
                // back to the begin round code, which will see what we should
                // be doing.
                case GameState.END_ROUND:
                    nextRound ();
                    this.state = GameState.BEGIN_ROUND;
                    break;
            }
        }
    }
}
