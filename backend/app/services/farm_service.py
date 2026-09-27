from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.farm import Farm
from app.models.tree import Tree, TreeHealthStatus
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut

class FarmService:
    @staticmethod
    def get_all(db: Session) -> List[FarmOut]:
        farms = db.query(Farm).all()
        result = []
        for farm in farms:
            # Aggregate tree counts
            total = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm.id).scalar() or 0
            healthy = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm.id, Tree.health_status == TreeHealthStatus.HEALTHY).scalar() or 0
            diseased = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm.id, Tree.health_status == TreeHealthStatus.DISEASE_DETECTED).scalar() or 0
            unknown = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm.id, Tree.health_status == TreeHealthStatus.UNKNOWN).scalar() or 0
            
            farm_dict = {
                "id": farm.id,
                "name": farm.name,
                "location": farm.location,
                "area_acres": farm.area_acres,
                "total_rows": farm.total_rows,
                "trees_per_row": farm.trees_per_row,
                "description": farm.description,
                "created_at": farm.created_at,
                "updated_at": farm.updated_at,
                "total_trees": total,
                "healthy_trees": healthy,
                "diseased_trees": diseased,
                "unknown_trees": unknown
            }
            result.append(FarmOut(**farm_dict))
        return result

    @staticmethod
    def get_by_id(db: Session, farm_id: int) -> Optional[Farm]:
        return db.query(Farm).filter(Farm.id == farm_id).first()

    @staticmethod
    def create(db: Session, farm_in: FarmCreate) -> Farm:
        farm = Farm(
            name=farm_in.name,
            location=farm_in.location,
            area_acres=farm_in.area_acres,
            total_rows=farm_in.total_rows,
            trees_per_row=farm_in.trees_per_row,
            description=farm_in.description
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
        
        # Auto-generate initial tree grid
        for r in range(1, farm.total_rows + 1):
            for c in range(1, farm.trees_per_row + 1):
                tree_num = f"T-R{r:02d}-C{c:02d}"
                tree = Tree(
                    farm_id=farm.id,
                    tree_number=tree_num,
                    row_number=r,
                    column_number=c,
                    health_status=TreeHealthStatus.UNKNOWN
                )
                db.add(tree)
        db.commit()
        return farm

    @staticmethod
    def update(db: Session, farm: Farm, farm_in: FarmUpdate) -> Farm:
        update_data = farm_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(farm, field, value)
        db.commit()
        db.refresh(farm)
        return farm

    @staticmethod
    def delete(db: Session, farm_id: int) -> bool:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            db.delete(farm)
            db.commit()
            return True
    @staticmethod
    def get_layout(db: Session, farm_id: int):
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            return None

        trees = db.query(Tree).filter(Tree.farm_id == farm.id).order_by(Tree.row_number, Tree.column_number).all()

        total_rows = farm.total_rows or 4
        trees_per_row = farm.trees_per_row or 6

        x_margin = 15.0
        y_margin = 16.0
        x_spacing = 18.0
        y_spacing = 22.0

        plot_width = round(x_margin * 2 + (trees_per_row - 1) * x_spacing, 1)
        plot_height = round(y_margin * 2 + (total_rows - 1) * y_spacing, 1)

        boundary = [
            {"x": 0.0, "y": 0.0},
            {"x": plot_width, "y": 0.0},
            {"x": plot_width, "y": plot_height},
            {"x": 0.0, "y": plot_height}
        ]

        # Map tree objects into spatial rows
        tree_map = {(t.row_number, t.column_number): t for t in trees}
        rows_layout = []
        path_points = []
        seq = 1

        for r in range(1, total_rows + 1):
            row_y = round(y_margin + (r - 1) * y_spacing, 1)
            row_trees = []
            
            # Determine direction for serpentine path
            cols_iter = list(range(1, trees_per_row + 1)) if (r % 2 == 1) else list(range(trees_per_row, 0, -1))

            for c in range(1, trees_per_row + 1):
                tree_x = round(x_margin + (c - 1) * x_spacing, 1)
                tree_obj = tree_map.get((r, c))
                latest_pred = tree_obj.predictions[-1] if (tree_obj and tree_obj.predictions) else None

                layout_t = {
                    "tree_id": tree_obj.id if tree_obj else (r - 1) * trees_per_row + c,
                    "tree_number": tree_obj.tree_number if tree_obj else f"T-R{r:02d}-C{c:02d}",
                    "row": r,
                    "column": c,
                    "x": tree_x,
                    "y": row_y,
                    "health_status": tree_obj.health_status.value if (tree_obj and hasattr(tree_obj.health_status, 'value')) else (tree_obj.health_status if tree_obj else "UNKNOWN"),
                    "variety": tree_obj.variety if tree_obj else "Alphonso",
                    "latest_disease": latest_pred.disease_name if latest_pred else None,
                    "latest_confidence": latest_pred.confidence if latest_pred else None
                }
                row_trees.append(layout_t)

            rows_layout.append({
                "row_number": r,
                "rail_y": row_y,
                "start_x": round(x_margin - 6.0, 1),
                "end_x": round(x_margin + (trees_per_row - 1) * x_spacing + 6.0, 1),
                "trees": row_trees
            })

            # Append serpentine waypoints for this row
            for c in cols_iter:
                tree_x = round(x_margin + (c - 1) * x_spacing, 1)
                tree_obj = tree_map.get((r, c))
                path_points.append({
                    "sequence": seq,
                    "x": tree_x,
                    "y": row_y,
                    "row": r,
                    "checkpoint_tree_id": tree_obj.id if tree_obj else None
                })
                seq += 1

        total_path_length = round(len(path_points) * x_spacing, 1)

        return {
            "farm_id": farm.id,
            "name": farm.name,
            "location": farm.location,
            "dimensions": {
                "width_meters": plot_width,
                "height_meters": plot_height
            },
            "boundary": boundary,
            "rows": rows_layout,
            "camera_paths": [
                {
                    "path_id": 1,
                    "name": "Overhead Continuous Serpentine Inspection Rail",
                    "total_length_meters": total_path_length,
                    "points": path_points
                }
            ]
        }

farm_service = FarmService()

