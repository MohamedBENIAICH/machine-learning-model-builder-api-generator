import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin

# ===============================================================
# DECISION TREE (your implementation, slightly improved)
# ===============================================================

class Node:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        
    def is_leaf(self):
        return self.value is not None


class DecisionTreeClassifierCustom(BaseEstimator, ClassifierMixin):
    def __init__(self, max_depth=10, min_samples_split=2, max_features=None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features  # None, int, or string ("sqrt")
        self.root = None
        
    def gini(self, y):
        proportions = np.bincount(y) / len(y)
        return 1 - np.sum(proportions ** 2)
    
    def split(self, X, y, feature, threshold):
        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        return X[left_mask], X[right_mask], y[left_mask], y[right_mask]
    
    def best_split(self, X, y):
        best_gini = float('inf')
        best_feature = None
        best_threshold = None
        
        n_features_total = X.shape[1]

        # Choose subset of features
        if self.max_features == "sqrt":
            n_features = int(np.sqrt(n_features_total))
        elif isinstance(self.max_features, int):
            n_features = self.max_features
        else:
            n_features = n_features_total

        feature_indices = np.random.choice(n_features_total, n_features, replace=False)
        
        for feature in feature_indices:
            thresholds = np.unique(X[:, feature])
            
            for threshold in thresholds:
                X_left, X_right, y_left, y_right = self.split(X, y, feature, threshold)
                
                if len(y_left) == 0 or len(y_right) == 0:
                    continue
                
                gini = (len(y_left) / len(y)) * self.gini(y_left) + \
                       (len(y_right) / len(y)) * self.gini(y_right)
                
                if gini < best_gini:
                    best_gini = gini
                    best_feature = feature
                    best_threshold = threshold
        
        return best_feature, best_threshold
    
    def build_tree(self, X, y, depth=0):
        n_samples = len(y)
        n_classes = len(np.unique(y))
        
        if depth >= self.max_depth or n_samples < self.min_samples_split or n_classes == 1:
            leaf_value = np.argmax(np.bincount(y))
            return Node(value=leaf_value)
        
        feature, threshold = self.best_split(X, y)
        
        if feature is None:
            leaf_value = np.argmax(np.bincount(y))
            return Node(value=leaf_value)
        
        X_left, X_right, y_left, y_right = self.split(X, y, feature, threshold)
        left = self.build_tree(X_left, y_left, depth + 1)
        right = self.build_tree(X_right, y_right, depth + 1)
        
        return Node(feature, threshold, left, right)
    
    def fit(self, X, y):
        self.classes_ = np.unique(y)
        self.root = self.build_tree(X, y)
        return self
    
    def predict_sample(self, x, node):
        if node.is_leaf():
            return node.value
        
        if x[node.feature] <= node.threshold:
            return self.predict_sample(x, node.left)
        return self.predict_sample(x, node.right)
    
    def predict(self, X):
        return np.array([self.predict_sample(x, self.root) for x in X])


# ===============================================================
# RANDOM FOREST CLASSIFIER
# ===============================================================

class RandomForestCustom(BaseEstimator, ClassifierMixin):
    def __init__(self, n_estimators=100, max_depth=10, min_samples_split=2,
                 max_features="sqrt"):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.trees = []
        
    def bootstrap_sample(self, X, y):
        n_samples = len(X)
        indices = np.random.choice(n_samples, n_samples, replace=True)
        return X[indices], y[indices]

    def fit(self, X, y):
        self.classes_ = np.unique(y)
        self.trees = []

        for _ in range(self.n_estimators):
            X_boot, y_boot = self.bootstrap_sample(X, y)
            tree = DecisionTreeClassifierCustom(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=self.max_features
            )
            tree.fit(X_boot, y_boot)
            self.trees.append(tree)
        
        return self

    def predict(self, X):
        # Collect predictions from all trees
        tree_preds = np.array([tree.predict(X) for tree in self.trees])
        
        # Majority vote
        final_preds = []
        for i in range(X.shape[0]):
            votes = tree_preds[:, i]
            final_preds.append(np.bincount(votes).argmax())
        
        return np.array(final_preds)

