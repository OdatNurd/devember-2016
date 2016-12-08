module nurdz.game
{
    /**
     * The entity that represents a cell inside of the Maze entity.
     *
     * These are basically regular Entity objects with a slightly different
     * common interface.
     */
    export class MazeCell extends Entity
    {
        /**
         * Construct a new maze cell that will render on the stage provided and
         * which will use the provided SpriteSheet.
         *
         * The dimensions of this entity are not set at construction time and
         * are instead set based on the size of the sprites in the attached
         * sprite sheet.
         *
         * Subclasses are responsible for setting the sprite sheet and for
         * ensuring that all MazeCell subclasses use the same size sprites.
         *
         * @param {Stage}  stage the stage that we use to render ourselves
         * @param {String} name  the entity name for this subclass
         */
        constructor (stage : Stage, name : string)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (name, stage, 0, 0, 0, 0, 1, {}, {}, 'blue');
        }

        /**
         * Returns a determination on whether this maze cell, in its current
         * state, would block the ball from moving through it or not.
         *
         * When this returns true, the ball is stopped before entering this
         * cell. Otherwise, it is allowed to enter this cell.
         *
         * @returns {boolean} true if this entity should block this ball moving
         * through it or false if it should allow such movement.
         */
        blocksBall () : boolean
        {
            return true;
        }

        /**
         * This method will be invoked on this maze cell when the ball enters
         * the cell that it contains.
         *
         * This can only happen if blocksBall() returns false, as otherwise the
         * ball would be blocked from entering this entity.
         *
         * The position of the ball (and thus of this grid entity) is passed in.
         * The ball will be shifted to the location of this point when this call
         * completes, which allows this entity to move this ball when it touches
         * it.
         */
        touchingBall (ballPosition : Point) : void
        {

        }

        /**
         * Returns a determination on where the ball would go if it was not
         * allowed to enter this cell. This only gets invoked in the case where
         * the ball is blocked from entering the cell (i.e. blockBall() returns
         * true).
         *
         * If this cell thinks that the ball would change locations by touching
         * it, it will modify the location provided to specify where the ball
         * should end up and then return true. Otherwise, it will leave the
         * location alone and only return false.
         *
         * @param   {Point}   location the location of where the ball currently
         * is; this will be modified if we return true to indicate where the
         * ball should have ended up.
         *
         * @returns {boolean} true if we changed the location passed in or false
         * if we left it alone.
         */
        changeBallLocation (location : Point) : boolean
        {
            return false;
        }

        /**
         * This is invoked after a call to changeBallLocation() that returned
         * true if the ball was actually changed to that location. That allows
         * this cell to do something in response to having successfully moved
         * the ball.
         */
        didChangeDirection () : void
        {

        }
    }
}