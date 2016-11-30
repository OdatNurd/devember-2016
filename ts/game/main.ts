module nurdz.main
{
    // Import the key codes module so that we can easily get at the pressed key
    import KeyCodes = nurdz.game.KeyCodes;

    /**
     * Set up the button on the page to toggle the state of the game.
     *
     * @param stage the stage to control
     * @param buttonID the ID of the button to mark up to control the game state
     */
    function setupButton (stage, buttonID)
    {
        // True when the game is running, false when it is not. This state is toggled by the button. We
        // assume that the game is going to start running.
        var gameRunning = true;

        // Get the button.
        var button = document.getElementById (buttonID);
        if (button == null)
            throw new ReferenceError ("No button found with ID '" + buttonID + "'");

        // Set up the button to toggle the stage.
        button.addEventListener ("click", function ()
        {
            // Try to toggle the game state. This will only throw an error if we try to put the game into
            // a state it is already in, which can only happen if the engine stops itself when we didn't
            // expect it.
            try
            {
                if (gameRunning)
                {
                    stage.muteMusic (true);
                    stage.muteSounds (true);
                    stage.stop ();
                }
                else
                {
                    stage.muteMusic (false);
                    stage.muteSounds (false);
                    stage.run ();
                }
            }

                // Log and then rethrow the error.
            catch (error)
            {
                console.log ("Exception generated while toggling game state");
                throw error;
            }

                // No matter what, toggle the game state. This will put the button back into sync for the next
                // click if it got out of sync.
            finally
            {
                // No matter what, toggle the state.
                gameRunning = !gameRunning;
                button.innerHTML = gameRunning ? "Stop Game" : "Restart Game";
            }
        });
    }

    // This interface extends the properties of regular entities to provide the properties that a Dot
    // might need in order to operate.
    interface DotProperties extends nurdz.game.EntityProperties
    {
        /**
         * The X speed of this dot as it moves around. If it's not specified, a random default is provided.
         */
        xSpeed? : number;

        /**
         * The Y speed of this dot as it moves around. If it's not specified, a random default is provided.
         */
        ySpeed? : number;
    }

    /**
     * This simple class just displays an image and slowly rotates in place.
     */
    class Star extends nurdz.game.Entity
    {
        /**
         * Construct an instance; it needs to know how it will be rendered.
         *
         * @param stage the stage that owns this actor.
         */
        constructor (stage : game.Stage)
        {
            // Invoke the super.
            super ("A star", stage, stage.width / 2, stage.height / 2, 64, 64, 1, {}, {}, 'green');

            // Turn on our debug property so our bounds get rendered too.
            this._properties.debug = true;

            // Set our origin to be somewhere interesting.
            this.origin.setToXY (64 / 3, 64 / 3);
        }

        /**
         * In our simple update method, we just rotate slowly around.
         *
         * @param stage the stage that owns us
         * @param tick the current game tick
         */
        update (stage : nurdz.game.Stage, tick : number) : void
        {
            // Advance our angle by 5 degrees. The angle is normalized for us.
            this.angle = this.angle + 5;
        }
    }

    /**
     * This simple class represents a Dot on the screen. It starts in the center of the screen and bounces
     * around.
     */
    class Dot extends nurdz.game.Entity
    {
        /**
         * Our properties; This is an override to the version in the Entity base class which changes the
         * type to be our extended properties type.
         *
         * @type {DotProperties}
         * @protected
         */
        protected _properties : DotProperties;

        /**
         * We need to override the properties property as well to change the type, otherwise outside code
         * will think our properties are EntityProperties, which is not very useful.
         *
         * @returns {DotProperties}
         */
        get properties () : DotProperties
        { return this._properties; }

        /**
         * Construct an instance; it needs to know how it will be rendered.
         *
         * @param stage the stage that owns this actor.
         * @param properties the properties to apply to this entity
         */
        constructor (stage : game.Stage, properties : DotProperties = {})
        {
            // Invoke the super to construct us. We position ourselves in the center of the stage.
            super ("A dot", stage, stage.width / 2, stage.height / 2, 0, 0, 1,
                   properties, <DotProperties> {
                    xSpeed: game.Utils.randomIntInRange (-5, 5),
                    ySpeed: game.Utils.randomIntInRange (-5, 5),
                }, 'red');

            // Convert to a circular bounding box with a radius of 10.
            this.makeCircle (10, true);

            // Show what we did in the console.
            console.log ("Dot entity created with properties: ", this._properties);
        }

        /**
         * This gets invoked by the Entity class constructor when it runs to allow us to validate that our
         * properties are OK.
         *
         * Here we make sure to fix up an X or Y speed that is 0 to be non-zero so that we always bounce
         * in a pleasing fashion.
         */
        protected validateProperties ()
        {
            // Let the super class do its job.
            super.validateProperties ();

            // Make sure our xSpeed is valid.
            if (this._properties.xSpeed == 0)
            {
                console.log ("Fixing a 0 xSpeed");
                this._properties.xSpeed = game.Utils.randomFloatInRange (-1, 1) > 0 ? 1 : -1;
            }

            // Make sure our ySpeed is valid.
            if (this._properties.ySpeed == 0)
            {
                console.log ("Fixing a 0 ySpeed");
                this._properties.ySpeed = game.Utils.randomFloatInRange (-1, 1) > 0 ? 1 : -1;
            }
        }

        /**
         * Update our position on the stage.
         *
         * @param stage the stage we are on
         */
        update (stage : game.Stage)
        {
            // Translate;
            this._position.translateXY (this._properties.xSpeed, this._properties.ySpeed);

            // Bounce left and right
            if (this._position.x < this.radius || this._position.x >= stage.width - this.radius)
                this._properties.xSpeed *= -1;

            // Bounce up and down.
            if (this._position.y < this.radius || this._position.y >= stage.height - this.radius)
                this._properties.ySpeed *= -1;
        }
    }

    /**
     * This is a simple extension of the scene class; it displays the FPS on the screen.
     *
     * Notice that it also clears the stage; the base Scene class only renders actors but doesn't clear
     * the screen, so that when you override it you can get the actor rendering "for free" without it
     * making assumptions about when it gets invoked.
     */
    class TestScene extends game.Scene
    {
        /**
         * Create a new test scene to be managed by the provided stage.
         *
         * @param stage the stage to manage us/
         */
        constructor (stage : game.Stage)
        {
            super ("A Scene", stage);

            // Create some dot entities.
            let dot1 = new Dot (stage, {debug: true});
            let dot2 = new Dot (stage, {debug: false});

            // Now add the dots entities and a star entity to ourselves so that they get updated and rendered.
            this.addActor (new Star (stage));
            this.addActor (dot1);
            this.addActor (dot2);
        }

        /**
         * Render the scene.
         */
        render ()
        {
            // Clear the screen, render any actors, and then display the FPS we're running at in the top
            // left corner.
            this._stage.renderer.clear ("black");
            super.render ();
            this._stage.renderer.drawTxt (`FPS: ${this._stage.fps}`, 16, 16, 'white');
            this._stage.renderer.fillCircle (400, 300, 2, 'red');
        }

        /**
         * Invoked when a key is pressed.
         *
         * @param eventObj the key press event
         * @returns {boolean} true if we handled the event or false otherwise
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            switch (eventObj.keyCode)
            {
                // For the F key, toggle between full screen mode and windowed mode.
                case KeyCodes.KEY_F:
                    this._stage.toggleFullscreen();
                    return true;

                default:
                    // Let the super do what super does. This allows screen shots to still work as expected.
                    return super.inputKeyDown (eventObj);
            }
        }
    }

    // Once the DOM is loaded, set things up.
    nurdz.contentLoaded (window, function ()
    {
        try
        {
            // Set up the stage.
            var stage = new game.Stage ('gameContent', 'black', true);

            // Set up the default values used for creating a screen shot.
            game.Stage.screenshotFilenameBase = "devember2016-";
            game.Stage.screenshotWindowTitle = "devember2016-";

            // Set up the button that will stop the game if something goes wrong.
            setupButton (stage, "controlBtn");

            // Register all of our scenes.
            stage.addScene ("sceneName", new TestScene (stage));

            // Switch to the initial scene, add a dot to display and then run the game.
            stage.switchToScene ("sceneName");
            stage.run ();
        }
        catch (error)
        {
            console.log ("Error starting the game");
            throw error;
        }
    });
}
