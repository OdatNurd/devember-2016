module nurdz.game
{
    /**
     * The entity that represents black holes (teleporters) in the game.
     */
    export class Teleport extends MazeCell
    {
        /**
         * An array of potential teleport destinations that can be accessed from
         * this teleport instance.
         */
        private _destinations : Array<Point>;

        /**
         * Get the destination of this teleport.
         *
         * There can be one or more destinations available from this teleport
         * instance, in which case one of them is randomly selected.
         *
         * If there are no destinations registered, this returns null
         *
         * @returns {Point} the destination of this teleport
         */
        get destination () : Point
        {
            // How we operate depends on how many many destinations we have
            switch (this._destinations.length)
            {
                // No known destinations
                case 0:
                    return null;

                // Exactly one destination
                case 1:
                    return this._destinations[0];

                // Many destinations
                default:
                    return this._destinations[Utils.randomIntInRange
                        (0, this._destinations.length - 1)];
            }
        }

        /**
         * Obtain the complete list of current destinations known to this
         * entity.
         *
         * This is an array which can have any number of elements, including 0.
         *
         * @returns {Array<Point>} the list of destinations stored in this
         * instance.
         */
        get destinationList () : Array<Point>
        { return this._destinations; }

        /**
         * Get the number of destinations registered on this teleport instance.
         *
         * This can be any number >= 0; when it is larger than 1, a destination
         * is randomly selected
         *
         * @returns {number} the number of destinations in the destination list
         * of this instance.
         */
        get length () : number
        { return this._destinations.length; }

        /**
         * Construct a new teleport entity that will render on the stage
         * provided.
         *
         * This entity is always in a continuously animated state.
         *
         * @param {Stage} stage the stage that we use to render ourselves
         */
        constructor (stage : Stage)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (stage, "blackHole");

            // Set up an animation. As this is the first animation, it will play
            // by default.
            this.addAnimation ("idle", 10, true, [35, 36, 37, 38, 39]);

            // Create the list of destinations
            this._destinations = new Array<Point> ();
        }

        /**
         * Internal helper; given a point, scan the list of destinations to see
         * if this destination appears anywhere in it. If it does, its index in
         * the destination array is returned; otherwise -1 is returned.
         *
         * @param   {Point}  destination the destination to check
         *
         * @returns {number}             the index of the destination in the
         * list, or -1 if it does not exist.
         */
        private indexOfDestination (destination : Point) : number
        {
            // Simple scan.
            for (let i = 0 ; i < this._destinations.length ; i++)
            {
                if (destination.equals (this._destinations[i]))
                    return i;
            }

            return -1;
        }

        /**
         * Perform a check to see if this teleport instance contains the
         * destination point provided.
         *
         * @param   {Point}   destination the destination to check
         *
         * @returns {boolean}             true if this teleport entity includes
         * the given point in it's destination list.
         */
        hasDestination (destination : Point) : boolean
        {
            return this.indexOfDestination (destination) != -1;
        }

        /**
         * Add a potential destination to this teleport instance. This can be
         * invoked more than once, in which case when activated the teleport
         * will randomly select the destination from those provided.
         *
         * If this destination is already in the list, nothing happens.
         *
         * @param {Point} destination the destination to add
         */
        addDestination (destination : Point) : void
        {
            if (this.indexOfDestination (destination) == -1)
                this._destinations.push (destination.copy ());
        }

        /**
         * Remove all known destinations from this teleport object. This removes
         * its ability to teleport the ball anywhere.
         */
        clearDestinations () : void
        {
            // Throw away all known destinations.
            this._destinations.length = 0;
        }

        /**
         * Remove a single destination from the list of destinations allowed by
         * this teleport instance.
         *
         * If the destination is not in the list, nothing happens.
         *
         * @param {Point} destination the destination to remove
         */
        clearDestination (destination : Point) : void
        {
            let index = this.indexOfDestination (destination);
            if (index != -1)
                this._destinations.splice (index, 1);
        }

        /**
         * Given a (possibly null) entity, determine if we could teleport to its
         * location or not. This is basically a helper to make the code easier
         * to read, even though the test is quite simple.
         *
         * @param   {MazeCell} entity the destination entity to check
         *
         * @returns {boolean}         true if it would be OK to jump the ball
         * here or false otherwise.
         */
        private canTeleportToEntity (entity : MazeCell) : boolean
        {
            // It's always OK to jump to an empty cell and it's usually OK to
            // jump to an entity that is of the same type as us (although other
            // code will determine if the location is not the source of the
            // jump).
            return (entity == null || entity.name == this.name);
        }

        /**
         * Checks to see if this entity has any unblocked destinations or not.
         * This will use the maze given to scan and see if any of the positions
         * that it contains are a valid, unblocked jump destination.
         *
         * The position provided is the "sending" end of this black hole, which
         * cannot be a possible destination even if it's not blocked.
         *
         * @param   {Maze}    maze           the maze to check
         * @param   {Point}   sourcePosition the position where the teleport
         * will start
         *
         * @returns {boolean}                true if it is possible for this
         * teleport to jump a ball to a non-blocked location, false otherwise
         */
        private hasUnblockedDestination (maze : Maze, sourcePosition : Point) : boolean
        {
            // Iterate over all of the destinations in our list.
            for (let index = 0 ; index < this._destinations.length ; index++)
            {
                // Get this destination and the content of the cell at that
                // position.
                let thisDest = this._destinations[index];
                let destCell = maze.contents.getCellAt (thisDest.x, thisDest.y);

                // If the destination entity is a valid teleport location and
                // it's not at the source position, we could teleport here.
                if (this.canTeleportToEntity (destCell) &&
                    sourcePosition.equals (thisDest) == false)
                    return true;
            }

            // If we get here, none of the positions are valid.
            return false;
        }

        /**
         * We don't block the ball because we change its position when it gets
         * on top of us instead of when it touches us.
         *
         * @param {boolean} isSimulation true if this is part of a simulation,
         * false otherwise
         *
         * @returns {boolean} always false; the ball is allowed to move through
         * us
         */
        blocksBall (isSimulation : boolean) : boolean
        {
            return false;
        }

        /**
         * When the ball is sitting on top of us, we transfer it to a different
         * location in the grid, which has been previously given to us, if
         * possible
         *
         * @param   {Maze}  maze     the maze containing us and the ball
         * @param   {Ball}  ball     the ball that is touching us
         * @param   {Point} location the location in the mazer that we are at
         *
         * @returns {Point}          the potential landing location, if we can
         * find one that is not blocked
         */
        ballTouch (maze : Maze, ball : Ball, location : Point) : Point
        {
            // If there are no destinations stored or we have no unblocked
            // destinations, we can't do anything.
            if (this.length == 0 || this.hasUnblockedDestination (maze, location) == false)
            {
                console.log("Teleport has no unblocked destinations.");
                return null;
            }

            // There are some destinations registered; get one out randomly and
            // get the maze cell at that position.
            let newPos = this.destination;
            let destCell = maze.contents.getCellAt (newPos.x, newPos.y);

            // As long as the cell given is a not a valid destination or the
            // position is the position we were given, keep generating.
            while (this.canTeleportToEntity (destCell) == false ||
                   newPos.equals (location))
            {
                // Try again. We know this won't infinitely loop because we did
                // the test above to verify that we could find a location.
                newPos = this.destination;
                destCell = maze.contents.getCellAt (newPos.x, newPos.y);
            }

            // Indicate the new position
            return newPos;
        }
    }
}