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
    }
}