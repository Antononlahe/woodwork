# Tabletop castle (hero build)

Static fortress for the catalog. ~340 × 340 × 180 mm. Parent + kid, advanced: jigsaw, drill, mitre box.

## Layout

12 mm ground plate. Four Ø56 disk-stack towers at the corners with cone caps. Curtain walls between them. Arched gate in the front wall. Square keep with a wedge roof in the yard. One stair to the wall walk. Merlons on the walls.

No moving parts.

## Format additions (`woodwork/v0`)

- `cone`: `{ diameter, height }` — origin base center, +Z up
- `wedge`: `{ size }` — min corner, ridge along +Y at x = size.x/2
- `arch`: `{ size, opening: { width, height } }` — box wall, opening through +Y
- `stairs`: `{ width, rise, run, count }` — min corner, flight along +X
- `merlon`: `{ size }` — crenel block, same frame as box

## Shop

12 mm vineer (plate, walls, keep, thick disks sliced to 12 mm). 6.5 mm for merlons if needed. Ø8 pins. PVA. Bits 8 mm. Jigsaw, mitre box, files.
