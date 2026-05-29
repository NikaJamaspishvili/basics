import pandas as pd
from xgboost import XGBRegressor
import pickle

# fake sales data (normally comes frowm your database)
data = pd.DataFrame(
    [
        {"discount": 0, "season": 1, "inventory": 200, "days": 5, "units_sold": 10},
        {"discount": 10, "season": 1, "inventory": 190, "days": 12, "units_sold": 22},
        {"discount": 20, "season": 1, "inventory": 168, "days": 19, "units_sold": 45},
        {"discount": 30, "season": 1, "inventory": 123, "days": 26, "units_sold": 61},
        {"discount": 0, "season": 2, "inventory": 200, "days": 5, "units_sold": 8},
        {"discount": 10, "season": 2, "inventory": 192, "days": 12, "units_sold": 15},
        {"discount": 20, "season": 2, "inventory": 177, "days": 19, "units_sold": 28},
        {"discount": 30, "season": 2, "inventory": 149, "days": 26, "units_sold": 39},
    ]
)

features = data[["discount", "season", "inventory", "days"]]
target = data["units_sold"]

model = XGBRegressor()
model.fit(features, target)

pickle.dump(model, open("model.pkl", "wb"))
print("model trained and saved")
