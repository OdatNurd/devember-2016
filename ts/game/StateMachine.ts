module nurdz.game
{
    /**
     * This enumeration represents all of the potential states that the state
     * machine may be in at any given time.
     */
    export enum GameState
    {
        /**
         * There is no state. The purposes of this value is to be different from
         * all possible known states so that it can act as a sentinel.
         */
        NO_STATE,

        /**
         * There is a maze currently being generated; no players are visible
         * and no interactions with the maze are allowed.
         */
        MAZE_GENERATION,

        /**
         * It is going to be the human players turn, but first we have to check
         * and see if it's even possible for them to make a play at the moment.
         */
        CHECK_VALID_PLAY_PLAYER,

        /**
         * The human player can take a turn now. Their controls work and they
         * can attempt to push a ball.
         */
        PLAYER_TURN,

        /**
         * It is going to be the computer players turn, but first we have to
         * check and see if it's even possible for them to make a play at the
         * moment.
         */
        CHECK_VALID_PLAY_COMPUTER,

        /**
         * The computer has selected its move and is now in the process of
         * taking it. This covers moving to the ball, turning, and pushing.
         */
        COMPUTER_TURN,

        /**
         * A ball is currently dropping through the maze. This can be either due
         * to the player pushing the ball, the AI pushing a ball, or the end of
         * round.
         */
        BALL_DROPPING,

        /**
         * All of the balls have been pushed (or are blocked) so it is time to
         * remove all of the gray bricks from the maze.
         */
        REMOVE_GRAY_BRICKS,

        /**
         * All of the gray bricks have been removed, so we are now in the
         * process of finding all balls that can still drop and dropping them.
         */
        FINAL_BALL_DROP,

        /**
         * All gray bricks have been removed and all of the final ball drops
         * have finished, so everything is done now.
         */
        GAME_OVER,

    }

    /**
     * This interface is used to pass a notification to parties interested in
     * state changes of any particular state machine.
     */
    export interface StateMachineChangeListener
    {
        /**
         * The state of the state machine being listened to was just switched to
         * the state provided.
         *
         * WARNING: All hell (probably) breaks loose if this method immediately
         * changes the state of the machine that was passed in, so maybe don't
         * do that?
         *
         * @param {StateMachine} machine  the machine whose state changed
         * @param {GameState}    newState the newly set state
         */
        stateChanged (machine : StateMachine, newState : GameState) : void;
    }

    /**
     * This class represents the state of the game in the current game. This is
     * uses in the Game scene to control what is happening and what can and
     * cannot happen at any given time.
     */
    export class StateMachine
    {
        /**
         * The state that the machine is currently in.
         */
        private _currentState : GameState;

        /**
         * The state that the machine was in prior to the current state, if
         * any.
         */
        private _previousState : GameState;

        /**
         * The list of objects that are interested in being informed when the
         * state changes.
         */
        private _listeners : Array<StateMachineChangeListener>;

        /**
         * The number of ticks that have elapsed since the state machine was
         * switched into the current state. This gets updated when our update
         * method is invoked and reset when our state changes.
         */
        private _ticksInState : number;

        /**
         * Get the current state of this state machine.
         *
         * @returns {GameState} the state that this machine is currently in
         */
        get state () : GameState
        { return this._currentState; }

        /**
         * Set the current state of this state machine to the state provided.
         * Attempts to switch to the current state have no effect and are
         * ignored.
         *
         * @param {GameState} newState the state to switch to.
         */
        set state (newState : GameState)
        {
            // Only do something when the state is actually changing
            if (this._currentState != newState)
            {
                // Save the current state, then switch it.
                this._previousState = this._currentState;
                this._currentState = newState;

                // Reset the number of ticks that have happened in this state.
                this._ticksInState = 0;

                // Trigger listeners.
                for (let i = 0 ; i < this._listeners.length ; i++)
                    this._listeners[i].stateChanged (this, this._currentState);
            }
        }

        /**
         * Get the state that this state machine was in prior to being in the
         * current state.
         *
         * Initially there is no previous state. Additionally, this only tracks
         * actual state changes, so attempts to switch to the state that is
         * currently already set does not update this state.
         *
         * @returns {GameState} the state that this machine was in prior to the
         * current state
         */
        get priorState () : GameState
        { return this._previousState; }

        /**
         * Construct a new state machine.
         */
        constructor ()
        {
            // Set the current and previous states.
            this._currentState = GameState.NO_STATE;
            this._previousState = GameState.NO_STATE;

            // Default our tick value.
            this._ticksInState = 0;

            // Create the listener array.
            this._listeners = new Array<StateMachineChangeListener> ();
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
            // Count this as an elapsed tick.
            this._ticksInState++;
        }

        /**
         * Check to see if the machine has been in the current state for at
         * least the number of ticks provided, returning a boolean that
         * indicates if this is the case.
         *
         * This is not meant to be used as a timer that you check multiple times,
         * as once the tick count hit has elapsed, this will continue to return
         * true.
         *
         * @param   {number}  tickCount the tick count to check
         *
         * @returns {boolean}           true if at least this many ticks have
         * elapsed, or false otherwise.
         */
        hasElapsed (tickCount : number) : boolean
        {
            return this._ticksInState >= tickCount;
        }

        /**
         * Check to see if a timer that triggers on a multiple of the number of
         * ticks given has triggered or not. Unlike hasElapsed(), this can be
         * used for a recurring timer.
         *
         * In order to use this effectively this needs to be checked on every
         * frame update; if you skip a check during a frame you run the risk of
         * missing the tick that causes the timer to fire.
         *
         * @param   {number}  tickMultiple the multiple of the tick to trigger
         * for, e.g. 30 triggers once a second
         *
         * @returns {boolean}              true if the timer triggers during
         * this tick or false otherwise
         */
        timerTrigger (tickMultiple : number) : boolean
        {
            return this._ticksInState % tickMultiple == 0;
        }

        /**
         * Add the given object to the list of objects that get informed
         * whenever the state of this machine changes.
         *
         * If the object provided is already a listener, this does nothing.
         *
         * @param {StateMachineChangeListener} listener the new listener to add
         */
        addListener (listener : StateMachineChangeListener) : void
        {
            // Add this listener if it's not already in the list.
            if (this._listeners.indexOf (listener) == -1)
                this._listeners.push (listener);
        }

        /**
         * Remove the given object from the list of objects that get informed
         * whenever the state of this machine changes.
         *
         * If the object provided is not a listener, this does nothing.
         *
         * @param {StateMachineChangeListener} listener the listener to remove
         */
        removeListener (listener : StateMachineChangeListener) : void
        {
            // Get the location of this listener; if it is in the list, remove
            // it.
            let location = this._listeners.indexOf (listener);
            if (location != -1)
                this._listeners.splice (location, 1);
        }
    }
}