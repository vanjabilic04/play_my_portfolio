import { scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue } from "./utils";
import { dialogueData } from "./constants";

k.loadSprite("moja_fix", "./moja_fix.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
        "idle-down": 0,
        "walk-down": {from: 0, to: 3, loop: true, speed: 8},
        "idle-up": 4,
        "walk-up": {from: 4, to: 7, loop: true, speed: 8},
        "idle-lside": 8,
        "walk-lside": {from: 8, to: 11, loop: true, speed: 8},
        "idle-rside": 12,
        "walk-rside": {from: 12, to: 15, loop: true, speed: 8},
    },
})

k.loadSprite("moja_soba", "./moja_soba.png");

k.setBackground(k.Color.fromHex("#57294b"));

k.scene("main", async () => {
    const moja_sobaData = await (await fetch("./moja_soba.tmj")).json()
    const layers = moja_sobaData.layers;

    const moja_soba = k.add([k.sprite("moja_soba"), k.anchor("center"), k.pos(k.width() / 2, k.height() / 2), k.scale(scaleFactor)]);

    const player = k.add([
        k.sprite("moja_fix", {anim: "idle-down"}), 
        k.area({
            shape: new k.Rect(k.vec2(0, 3), 10, 16),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(k.width() / 2, k.height() / 2),
        k.scale(scaleFactor),
        {
            speed: 150,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                
                    moja_soba.add([
                        k.area({ shape: new k.Rect(k.vec2(0), boundary.width, boundary.height)}),
                        k.body({ isStatic: true }),
                        k.pos(
                            boundary.x - (moja_sobaData.width * moja_sobaData.tilewidth) / 2,
                            boundary.y - (moja_sobaData.height * moja_sobaData.tileheight) / 2
                        ),
                        boundary.name,
                    ]);
                if(boundary.name && boundary.name !== "wall" && boundary.name !== "lamp" && boundary.name !== "plant") {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        displayDialogue(dialogueData[boundary.name], () => (player.isInDialogue = false));
                    });
                }
            }
            continue;
        }

        if (layer.name === "spawnpoint") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                    player.pos = k.vec2(
                        (moja_soba.pos.x + entity.x) * scaleFactor,
                        (moja_soba.pos.y + entity.y) * scaleFactor
                    );
                    continue;
                }
            }
        }
    }

    //setCamScale(k);

    //k.onResize(() => {
    //    setCamScale(k);
    //});

    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100);
    })

    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        if (
            mouseAngle > lowerBound &&
            mouseAngle < upperBound &&
            player.curAnim() !== "walk-up"
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        if (
            mouseAngle < -lowerBound &&
            mouseAngle > -upperBound &&
            player.curAnim() !== "walk-down"
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-rside") player.play("walk-rside");
            player.direction = "right";
            return;
        }

        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-lside") player.play("walk-lside");
            player.direction = "left";
            return;
        }
    });

    k.onMouseRelease(() => {
        if(player.direction === "down") {
            player.play("idle-down");
            return;
        }
        if(player.direction === "up") {
            player.play("idle-up");
            return;
        }

        if (player.direction === "left" && player.curAnim() !== "idle-lside") {
            player.play("idle-lside");
        } else if (player.direction === "right" && player.curAnim() !== "idle-rside") {
            player.play("idle-rside");
        }  
    });
});

k.go("main");