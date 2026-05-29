import pandas as pd
import pickle

# load saved model
model = pickle.load(open("model.pkl", "rb"))


new_data = pd.DataFrame([{"pet": 1}])

predicted = model.predict(new_data)
print(f"own pet | smart scale: {round(predicted[0])}")
