module nurdz.game
{
    /**
     * This interface is used to mark MazeCell instances that can be hidden or
     * shown, and by extension do an animated vanish or return.
     */
    export interface HideableMazeCell extends Actor
    {
        /**
         * An indication as to whether the last command to this entity from the
         * ones listed below told it to be hidden or not.
         */
        isHidden : boolean;

        /**
         * These methods make this entity visible.
         */
        idle () : void;
        appear () : void;

        /**
         * These methods make this entity
         */
        hide () : void;
        vanish () : void;
    }

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
         * which has the entity name provided.
         *
         * This class will automatically set the sprite sheet to the sheet
         * used by all MazeCell subclasses and invoke the setDimensions() method
         * once the preload has completed, at which point dimensions and other
         * handling can be done.
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

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.preloadComplete);
        }

        /**
         * This callback is invoked when the preload of our sprite sheet is
         * finished and the image is fully loaded.
         *
         * This method is not overrideable due to the way it is implemented, so
         * we just invoke the client version of this method so that subclasses
         * can specialize if needed.
         *
         * @param {SpriteSheet} sheet the sprite sheet that was loaded
         */
        private preloadComplete = (sheet : SpriteSheet) : void =>
        {
            // Invoke the regular method now.
            this.spritesheetLoaded (sheet);
        }

        /**
         * This is invoked when our sprite sheet has finished loading, allowing
         * us to perform any tasks that require information from the sprite
         * sheet, such as the dimensions.
         *
         * @param {SpriteSheet} sheet the loaded sprite sheet
         */
        protected spritesheetLoaded (sheet : SpriteSheet) : void
        {
            // Set our bounds based on the dimensions of the sprites in the
            // loaded sheet.
            this.makeRectangle (sheet.width, sheet.height);
        }

        /**
         * Render this cell using the renderer provided. The positionprovided
         * represents the actual position of this cell as realized on the
         * screen, which means that assumes that is relative to the screen and
         * not the Maze entity.
         *
         * @param x the x location to render the cell at, in stage coordinates
         * (NOT world)
         * @param y the y location to render the cell at, in stage coordinates
         * (NOT world)
         * @param renderer the class to use to render the cell
         */
        render (x : number, y : number, renderer : Renderer) : void
        {
            // Let the super do the work now.
            super.render (x, y, renderer);
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
         * If this Maze cell blocks the ball (blocksBall() returns true), then
         * this method will be invoked to indicate that the ball tried to enter
         * the same maze cell as it is currently occupies..
         *
         * The collision is informed of the maze that it is contained in, the
         * ball that it is colliding with, and the location in the maze that the
         * collision is happening at (i.e. the location in the maze of this
         * MazeCell).
         *
         * If desired, the position of the ball can be modified by returning a
         * point that represents the new position in the maze. Otherwise, the
         * ball is left at the current location.
         *
         * This position may or may not be used by the engine; if it is,
         * didMoveBall() will be invoked to tell us that the ball provided was
         * actually moved.
         *
         * @param   {Maze}  maze     the maze containing us and the ball
         * @param   {Ball}  ball     the ball that is coliding with us
         * @param   {Point} location the location in the maze that we are at
         *
         * @returns {Point}          if non-null, this is the position that the
         * ball should be moved to in response to colliding with us; a return
         * value of null indicates the ball should stay where it is.
         */
        ballCollision (maze : Maze, ball : Ball, location : Point) : Point
        {
            return null;
        }

        /**
         * This is invoked after a call to ballCollsiion() indicated that the
         * ball location should be changed as a result of colliding with us, and
         * the position of the ball was actually changed as a result of what we
         * said.
         *
         * The ball that was moved is provided to the call to indicate which
         * ball was the one that moved.
         *
         * @param {Ball} ball the ball that we moved
         */
        didMoveBall (ball : Ball) : void
        {

        }

        /**
         * This is invoked when the ball enters the same cell as this maze
         * entity (which measns that a call to blocksBall() returned false) to
         * tell us that the ball has actually entered our location.
         *
         * The collision is informed of the maze that it is contained in, the
         * ball that is touching us, and the location in the mazr that the touch
         * is happening at (i.e. the location in the maze of this MazeCell).
         *
         * If desired, the position of the ball can be modified by returning a
         * pooint that represents the new position in the maze; otherwise the
         * ball is left at the current location.
         *
         * This position may or may not be used by the engine. If the position
         * of the ball is changed, a touch event will not fire if the ball was
         * placed on top of another entity that supports this call.
         *
         * @param   {Maze}  maze     the maze containing us and the ball
         * @param   {Ball}  ball     the ball that is touching us
         * @param   {Point} location the location in the mazer that we are at
         *
         * @returns {Point}          if non-null, this is the position that the
         * ball should be moved to in response to touching us; a return value of
         * null indicates that the ball should stay where it is
         */
        ballTouch (maze : Maze, ball : Ball, location : Point) : Point
        {
            return null;
        }
    }
}