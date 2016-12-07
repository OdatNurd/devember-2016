module nurdz.game
{
    /**
     * The entity that represents black holes (teleporters) in the game.
     */
    export class Teleport extends MazeCell
    {
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

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Set up an animation. As this is the first animation, it will play
            // by default.
            this.addAnimation ("idle", 10, true, [35, 36, 37, 38, 39]);
        }

        /**
         * This callback is invoked when our sprite sheet finishes loading the
         * underlying image for the sprites. It allows us to set our bounds to
         * be a rectangle at the dimensions of the sprites in the sprite sheet.
         */
        private setDimensions = (sheet : SpriteSheet) : void =>
        {
            // Alter our collision properties
            this.makeRectangle (sheet.width, sheet.height);
        }

        /**
         * Technically the teleport SHOULD block the ball and then it's
         * changeBallLocation() would select the location of one of the other
         * teleports, but for now we just allow the ball to pass through us.
         *
         * @returns {boolean} always false; the ball is allowed to move through
         * us
         */
        blocksBall () : boolean
        {
            return false;
        }
    }

}
