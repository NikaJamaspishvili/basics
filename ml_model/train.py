import pandas as pd
from xgboost import XGBRegressor
import pickle

# fake sales data (normally comes frowm your database)
data = pd.DataFrame(
    [
        {"pet": 2, "smart": 30},
        {"pet": 1, "smart": 50},
        {"pet": 2, "smart": 70},
        {"pet": 1, "smart": 50},
        {"pet": 2, "smart": 30},
        {"pet": 1, "smart": 50},
        {"pet": 2, "smart": 20},
        {"pet": 1, "smart": 50},
        {"pet": 2, "smart": 200},
        {"pet": 1, "smart": 50},
    ]
)

features = data[["pet"]]
target = data["smart"]

model = XGBRegressor()
model.fit(features, target)

pickle.dump(model, open("model.pkl", "wb"))
print("model trained and saved")
