# ensemble_custom.py
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin, RegressorMixin
from collections import Counter

# -------------------------
# Decision Tree (Regressor + Classifier)
# -------------------------
class _Node:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value  # for leaf: scalar (regressor) or class index (classifier)

    def is_leaf(self):
        return self.value is not None

class DecisionTreeBase:
    def __init__(self, max_depth=5, min_samples_split=2, min_samples_leaf=1, max_features=None):
        self.max_depth = int(max_depth)
        self.min_samples_split = int(min_samples_split)
        self.min_samples_leaf = int(min_samples_leaf)
        self.max_features = max_features  # int or float fraction or "sqrt" or None
        self.n_features_ = None
        self.root = None

    def _get_n_features_to_try(self):
        if self.max_features is None:
            return self.n_features_
        if isinstance(self.max_features, float):
            return max(1, int(self.max_features * self.n_features_))
        if isinstance(self.max_features, int):
            return min(self.max_features, self.n_features_)
        if self.max_features == "sqrt":
            return max(1, int(np.sqrt(self.n_features_)))
        raise ValueError("invalid max_features")

    @staticmethod
    def _threshold_candidates(feature_values):
        # use midpoints between sorted unique values (better than using raw uniques)
        unique = np.unique(feature_values)
        if unique.shape[0] == 1:
            return np.array([])
        unique.sort()
        return (unique[:-1] + unique[1:]) / 2.0

class DecisionTreeRegressor(DecisionTreeBase, RegressorMixin):
    def __init__(self, max_depth=5, min_samples_split=2, min_samples_leaf=1, max_features=None):
        super().__init__(max_depth, min_samples_split, min_samples_leaf, max_features)

    def _mse(self, y):
        if y.size == 0: 
            return 0.0
        m = np.mean(y)
        return np.mean((y - m) ** 2)

    def _best_split(self, X, y):
        best_feature, best_threshold, best_score = None, None, float('inf')
        n_samples, n_features = X.shape
        self.n_features_ = n_features
        n_feat_try = self._get_n_features_to_try()
        features = np.random.choice(n_features, n_feat_try, replace=False)

        base_mse = self._mse(y)
        if n_samples < self.min_samples_split or base_mse == 0:
            return None, None

        for feature in features:
            thresholds = self._threshold_candidates(X[:, feature])
            for t in thresholds:
                left_mask = X[:, feature] <= t
                right_mask = ~left_mask
                n_left = left_mask.sum()
                n_right = n_samples - n_left
                if n_left < self.min_samples_leaf or n_right < self.min_samples_leaf:
                    continue
                mse = (n_left * self._mse(y[left_mask]) + n_right * self._mse(y[right_mask])) / n_samples
                if mse < best_score:
                    best_score = mse
                    best_feature = feature
                    best_threshold = t

        return best_feature, best_threshold

    def _build(self, X, y, depth=0):
        n_samples = X.shape[0]
        if depth >= self.max_depth or n_samples < self.min_samples_split or y.size == 0:
            return _Node(value=np.mean(y) if y.size > 0 else 0.0)

        feature, threshold = self._best_split(X, y)
        if feature is None:
            return _Node(value=np.mean(y))

        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        left = self._build(X[left_mask], y[left_mask], depth + 1)
        right = self._build(X[right_mask], y[right_mask], depth + 1)
        return _Node(feature, threshold, left, right)

    def fit(self, X, y):
        X = np.asarray(X)
        y = np.asarray(y, dtype=float)
        self.n_features_ = X.shape[1]
        self.root = self._build(X, y, depth=0)
        return self

    def _predict_one(self, x, node):
        if node.is_leaf():
            return node.value
        if x[node.feature] <= node.threshold:
            return self._predict_one(x, node.left)
        else:
            return self._predict_one(x, node.right)

    def predict(self, X):
        X = np.asarray(X)
        return np.array([self._predict_one(x, self.root) for x in X])

class DecisionTreeClassifier(DecisionTreeBase, ClassifierMixin):
    def __init__(self, max_depth=5, min_samples_split=2, min_samples_leaf=1, max_features=None):
        super().__init__(max_depth, min_samples_split, min_samples_leaf, max_features)

    def _gini(self, y):
        if y.size == 0:
            return 0.0
        counts = np.bincount(y)
        ps = counts / counts.sum()
        return 1.0 - np.sum(ps ** 2)

    def _best_split(self, X, y):
        best_feature, best_threshold, best_score = None, None, float('inf')
        n_samples, n_features = X.shape
        self.n_features_ = n_features
        n_feat_try = self._get_n_features_to_try()
        features = np.random.choice(n_features, n_feat_try, replace=False)

        base_gini = self._gini(y)
        if n_samples < self.min_samples_split or base_gini == 0:
            return None, None

        for feature in features:
            thresholds = self._threshold_candidates(X[:, feature])
            for t in thresholds:
                left_mask = X[:, feature] <= t
                n_left = left_mask.sum()
                n_right = n_samples - n_left
                if n_left < self.min_samples_leaf or n_right < self.min_samples_leaf:
                    continue
                gini = (n_left * self._gini(y[left_mask]) + n_right * self._gini(y[~left_mask])) / n_samples
                if gini < best_score:
                    best_score = gini
                    best_feature = feature
                    best_threshold = t

        return best_feature, best_threshold

    def _build(self, X, y, depth=0):
        n_samples = X.shape[0]
        num_classes = np.unique(y).size
        if depth >= self.max_depth or n_samples < self.min_samples_split or num_classes == 1:
            # leaf predicts majority class index
            counts = np.bincount(y)
            return _Node(value=np.argmax(counts))

        feature, threshold = self._best_split(X, y)
        if feature is None:
            counts = np.bincount(y)
            return _Node(value=np.argmax(counts))

        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        left = self._build(X[left_mask], y[left_mask], depth + 1)
        right = self._build(X[right_mask], y[right_mask], depth + 1)
        return _Node(feature, threshold, left, right)

    def fit(self, X, y):
        X = np.asarray(X)
        y = np.asarray(y, dtype=int)
        self.classes_, y_enc = np.unique(y, return_inverse=True)
        self.n_features_ = X.shape[1]
        self.root = self._build(X, y_enc, depth=0)
        return self

    def _predict_one(self, x, node):
        if node.is_leaf():
            return node.value
        if x[node.feature] <= node.threshold:
            return self._predict_one(x, node.left)
        else:
            return self._predict_one(x, node.right)

    def predict(self, X):
        X = np.asarray(X)
        preds = np.array([self._predict_one(x, self.root) for x in X])
        return self.classes_[preds]

# -------------------------
# Random Forest Classifier
# -------------------------
class RandomForestClassifierCustom(BaseEstimator, ClassifierMixin):
    def __init__(self, n_estimators=100, max_depth=6, min_samples_split=2, min_samples_leaf=1,
                 max_features="sqrt", bootstrap=True, n_jobs=1, random_state=None):
        self.n_estimators = int(n_estimators)
        self.max_depth = int(max_depth)
        self.min_samples_split = int(min_samples_split)
        self.min_samples_leaf = int(min_samples_leaf)
        self.max_features = max_features
        self.bootstrap = bootstrap
        self.n_jobs = n_jobs  # not used for parallelization in this simple implementation
        self.random_state = random_state
        self.trees_ = []
        self.classes_ = None

    def fit(self, X, y):
        rng = np.random.RandomState(self.random_state)
        X = np.asarray(X)
        y = np.asarray(y)
        n_samples = X.shape[0]
        self.classes_, _ = np.unique(y, return_inverse=True)

        self.trees_ = []
        for i in range(self.n_estimators):
            if self.bootstrap:
                idx = rng.choice(n_samples, n_samples, replace=True)
            else:
                idx = np.arange(n_samples)
            X_boot = X[idx]
            y_boot = y[idx]

            tree = DecisionTreeClassifier(max_depth=self.max_depth,
                                          min_samples_split=self.min_samples_split,
                                          min_samples_leaf=self.min_samples_leaf,
                                          max_features=self.max_features)
            tree.fit(X_boot, y_boot)
            self.trees_.append(tree)
        return self

    def predict(self, X):
        X = np.asarray(X)
        # collect predictions from all trees
        all_preds = np.array([tree.predict(X) for tree in self.trees_])  # shape (n_trees, n_samples)
        all_preds = all_preds.T  # shape (n_samples, n_trees)
        results = []
        for preds in all_preds:
            # majority vote
            counts = Counter(preds)
            results.append(counts.most_common(1)[0][0])
        return np.array(results)

# -------------------------
# Gradient Boosting Classifier (binary)
# -------------------------
class GradientBoostingClassifierCustom(BaseEstimator, ClassifierMixin):
    """
    Gradient boosting for binary classification using logistic loss.
    Uses DecisionTreeRegressor as weak learners (fits residuals / negative gradient).
    """
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3,
                 min_samples_split=2, min_samples_leaf=1, max_features=None, random_state=None):
        self.n_estimators = int(n_estimators)
        self.learning_rate = float(learning_rate)
        self.max_depth = int(max_depth)
        self.min_samples_split = int(min_samples_split)
        self.min_samples_leaf = int(min_samples_leaf)
        self.max_features = max_features
        self.random_state = random_state

        self.trees_ = []
        self.init_score_ = 0.0
        self.classes_ = None

    @staticmethod
    def _sigmoid(z):
        # numerical stability
        z = np.clip(z, -500, 500)
        return 1.0 / (1.0 + np.exp(-z))

    def fit(self, X, y):
        rng = np.random.RandomState(self.random_state)
        X = np.asarray(X)
        y = np.asarray(y)
        # Binary classification only
        self.classes_, y_enc = np.unique(y, return_inverse=True)
        if self.classes_.size != 2:
            raise ValueError("GradientBoostingClassifierCustom currently supports binary classification only.")

        y_binary = y_enc  # 0/1

        # Init raw score F0 (log-odds of the positive class)
        pos_rate = np.clip(np.mean(y_binary), 1e-10, 1 - 1e-10)
        self.init_score_ = np.log(pos_rate / (1 - pos_rate))

        F = np.full(len(y_binary), self.init_score_, dtype=float)

        self.trees_ = []
        for m in range(self.n_estimators):
            p = self._sigmoid(F)
            # negative gradient for logistic loss = y - p
            residual = y_binary - p

            # Fit regression tree to residuals
            tree = DecisionTreeRegressor(max_depth=self.max_depth,
                                         min_samples_split=self.min_samples_split,
                                         min_samples_leaf=self.min_samples_leaf,
                                         max_features=self.max_features)
            # optionally shuffle / subsample indices? we keep full dataset for simplicity
            tree.fit(X, residual)

            update = tree.predict(X)  # real-valued
            # shrinkage update
            F += self.learning_rate * update

            self.trees_.append(tree)

        return self

    def decision_function(self, X):
        X = np.asarray(X)
        F = np.full(X.shape[0], self.init_score_, dtype=float)
        for tree in self.trees_:
            F += self.learning_rate * tree.predict(X)
        return F

    def predict_proba(self, X):
        F = self.decision_function(X)
        p = self._sigmoid(F)
        return np.vstack([1 - p, p]).T

    def predict(self, X):
        proba = self.predict_proba(X)[:, 1]
        labels = np.where(proba >= 0.5, self.classes_[1], self.classes_[0])
        return labels

# -------------------------
# EXAMPLE USAGE
# -------------------------
if __name__ == "__main__":
    # quick smoke test on a tiny synthetic dataset
    from sklearn.datasets import make_classification
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score

    X, y = make_classification(n_samples=500, n_features=6, n_informative=4, n_redundant=0,
                               random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    print("=== RandomForestClassifierCustom ===")
    rf = RandomForestClassifierCustom(n_estimators=30, max_depth=6, max_features="sqrt", random_state=123)
    rf.fit(X_train, y_train)
    preds_rf = rf.predict(X_test)
    print("RF acc:", accuracy_score(y_test, preds_rf))

    print("=== GradientBoostingClassifierCustom ===")
    gb = GradientBoostingClassifierCustom(n_estimators=50, learning_rate=0.1, max_depth=3, max_features="sqrt", random_state=123)
    gb.fit(X_train, y_train)
    preds_gb = gb.predict(X_test)
    print("GB acc:", accuracy_score(y_test, preds_gb))
