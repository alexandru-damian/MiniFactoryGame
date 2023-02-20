import Scene from './scene';

window.addEventListener ('DOMContentLoaded', ()=>
{
    let game = new Scene("canvas");

    game.createScene();
    game.render();
})