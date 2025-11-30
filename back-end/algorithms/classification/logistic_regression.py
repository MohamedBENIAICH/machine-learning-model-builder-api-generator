import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin

class LogisticRegressionCustom(BaseEstimator, ClassifierMixin):
    """
    Logistic Regression (Binary + Multiclass OvR)
    With gradient descent, L2 regularization, and convergence check.
    """
    def __init__(
        self,
        learning_rate=0.01,
        n_iterations=5000,
        regularization=0.01,
        tolerance=1e-6
    ):
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.regularization = regularization
        self.tolerance = tolerance
        self.weights = None
        self.bias = None

    def sigmoid(self, z):
        z = np.clip(z, -500, 500)
        return 1 / (1 + np.exp(-z))

    # Binary cross-entropy loss
    def compute_loss(self, y_true, y_pred, weights):
        eps = 1e-12
        y_pred = np.clip(y_pred, eps, 1 - eps)
        regularization_term = 0.5 * self.regularization * np.sum(weights ** 2)
        return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred)) + regularization_term

    def fit(self, X, y):
        X = np.asarray(X)
        y = np.asarray(y)
        n_samples, n_features = X.shape

        self.classes_ = np.unique(y)

        # --------------------------------------------
        # BINARY CLASSIFICATION
        # --------------------------------------------
        if len(self.classes_) == 2:
            y_binary = np.where(y == self.classes_[1], 1, 0)

            self.weights = np.zeros(n_features)
            self.bias = 0

            prev_loss = float("inf")

            for _ in range(self.n_iterations):
                linear_model = np.dot(X, self.weights) + self.bias
                y_pred = self.sigmoid(linear_model)

                # Gradients
                dw = (1 / n_samples) * np.dot(X.T, (y_pred - y_binary)) + self.regularization * self.weights
                db = (1 / n_samples) * np.sum(y_pred - y_binary)

                # Update parameters
                self.weights -= self.learning_rate * dw
                self.bias -= self.learning_rate * db

                # Convergence check (important!)
                loss = self.compute_loss(y_binary, y_pred, self.weights)
                if abs(prev_loss - loss) < self.tolerance:
                    break
                prev_loss = loss

        # --------------------------------------------
        # MULTICLASS – ONE VS REST (OvR)
        # --------------------------------------------
        else:
            n_classes = len(self.classes_)
            self.weights = np.zeros((n_classes, n_features))
            self.bias = np.zeros(n_classes)

            for i, cls in enumerate(self.classes_):
                y_binary = np.where(y == cls, 1, 0)

                weights = np.zeros(n_features)
                bias = 0
                prev_loss = float("inf")

                for _ in range(self.n_iterations):
                    linear_model = np.dot(X, weights) + bias
                    y_pred = self.sigmoid(linear_model)

                    dw = (1 / n_samples) * np.dot(X.T, (y_pred - y_binary)) + self.regularization * weights
                    db = (1 / n_samples) * np.sum(y_pred - y_binary)

                    weights -= self.learning_rate * dw
                    bias -= self.learning_rate * db

                    loss = self.compute_loss(y_binary, y_pred, weights)
                    if abs(prev_loss - loss) < self.tolerance:
                        break
                    prev_loss = loss

                self.weights[i] = weights
                self.bias[i] = bias

        return self

    def predict(self, X):
        X = np.asarray(X)

        # Binary case
        if len(self.classes_) == 2:
            linear_model = np.dot(X, self.weights) + self.bias
            y_pred = self.sigmoid(linear_model)
            return np.where(y_pred >= 0.5, self.classes_[1], self.classes_[0])

        # Multiclass case
        linear_models = np.dot(X, self.weights.T) + self.bias
        probs = self.sigmoid(linear_models)
        return self.classes_[np.argmax(probs, axis=1)]
