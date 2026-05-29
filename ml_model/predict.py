import pandas as pd
import pickle

# load saved model
model = pickle.load(open("model.pkl", "rb"))

# predict: winter, 20% discount, 180 inventory, 15 days old
new_data = pd.DataFrame([{"discount": 20, "season": 1, "inventory": 180, "days": 15}])

predicted = model.predict(new_data)
print(f"predicted units sold: {round(predicted[0])}")
