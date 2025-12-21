import os
import uuid
from datetime import datetime
from typing import List
from pathlib import Path
from urllib.parse import quote_plus
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

# Load .env from the backend directory specifically
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI()

# --- CORS ---
origins = [
    "http://localhost:5173",
    "*" # While testing, allow all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection Logic ---
MONGO_URI = os.getenv("MONGO_URI")
MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")

# Initialize collection variables to None
client = None
db = None
users_col = None
trees_col = None
msgs_col = None

# 1. Sanity Check: If MONGO_URI exists but doesn't look like a mongo string, ignore it
if MONGO_URI and not MONGO_URI.startswith("mongodb"):
    print(f"Warning: MONGO_URI found but looks invalid (starts with '{MONGO_URI[:5]}...'). Ignoring it.")
    MONGO_URI = None

# 2. Construct URI from components if needed
if not MONGO_URI and MONGO_USER and MONGO_PASSWORD and MONGO_CLUSTER:
    try:
        # Clean the cluster url (remove protocol or trailing slashes if user pasted them)
        clean_cluster = MONGO_CLUSTER.replace("mongodb+srv://", "").replace("/", "")
        
        print("Constructing MONGO_URI from .env components...")
        MONGO_URI = f"mongodb+srv://{quote_plus(MONGO_USER)}:{quote_plus(MONGO_PASSWORD)}@{clean_cluster}/?retryWrites=true&w=majority"
    except Exception as e:
        print(f"Error constructing URI: {e}")

if not MONGO_URI:
    print("CRITICAL WARNING: No valid MONGO_URI found. Database will NOT work.")
    print("Please check your backend/.env file.")

# 3. Attempt Connection
try:
    if MONGO_URI:
        # Connect with a timeout so we don't hang forever
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client["decomytree"]
        users_col = db["users"]
        trees_col = db["trees"]
        msgs_col = db["messages"]
        
        # Trigger a test command to ensure connection is real
        client.server_info()
        print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    # Reset variables to None so we fail gracefully in routes
    client = None
    users_col = None

# --- Helper to check DB connection ---
def check_db():
    if users_col is None:
        raise HTTPException(status_code=503, detail="Database connection failed or not initialized. Check server logs.")

# --- Models ---
class UserAuth(BaseModel):
    username: str
    password: str

class TreeCreate(BaseModel):
    name: str
    pin: str
    ownerId: str

class MessageCreate(BaseModel):
    treeId: str
    content: str
    sender: str
    color: str

class Tree(BaseModel):
    id: str
    ownerId: str
    name: str
    pin: str
    createdAt: str
    theme: str

class Message(BaseModel):
    id: str
    treeId: str
    content: str
    sender: str
    color: str
    createdAt: str

# --- Routes ---

@app.get("/")
def read_root():
    check_db()
    return {"status": "DecoMyTree API running & DB Connected"}

@app.post("/signup")
def signup(user: UserAuth):
    check_db()
    try:
        if users_col.find_one({"username": user.username}):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        user_id = str(uuid.uuid4())
        users_col.insert_one({
            "id": user_id,
            "username": user.username,
            "password": user.password
        })
        return {"id": user_id, "username": user.username}
    except PyMongoError as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed. Check server logs.")

@app.post("/login")
def login(user: UserAuth):
    check_db()
    try:
        u = users_col.find_one({"username": user.username, "password": user.password})
        if u:
            return {"id": u["id"], "username": u["username"]}
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except PyMongoError as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

@app.post("/trees", response_model=Tree)
def create_tree(tree_in: TreeCreate):
    check_db()
    try:
        tree_id = str(uuid.uuid4())
        new_tree = {
            "id": tree_id,
            "ownerId": tree_in.ownerId,
            "name": tree_in.name,
            "pin": tree_in.pin,
            "createdAt": datetime.now().isoformat(),
            "theme": "classic"
        }
        trees_col.insert_one(new_tree)
        new_tree.pop("_id")
        return new_tree
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trees/{tree_id}", response_model=Tree)
def get_tree(tree_id: str):
    check_db()
    try:
        tree = trees_col.find_one({"id": tree_id}, {"_id": 0})
        if not tree:
            raise HTTPException(status_code=404, detail="Tree not found")
        return tree
    except PyMongoError:
        raise HTTPException(status_code=500, detail="DB Error")

@app.get("/user-trees/{user_id}", response_model=List[Tree])
def get_user_trees(user_id: str):
    check_db()
    try:
        cursor = trees_col.find({"ownerId": user_id}, {"_id": 0})
        trees = list(cursor)
        trees.sort(key=lambda x: x["createdAt"], reverse=True)
        return trees
    except PyMongoError:
        return []

@app.post("/messages", response_model=Message)
def add_message(msg_in: MessageCreate):
    check_db()
    try:
        msg_id = str(uuid.uuid4())
        new_msg = {
            "id": msg_id,
            "treeId": msg_in.treeId,
            "content": msg_in.content,
            "sender": msg_in.sender,
            "color": msg_in.color,
            "createdAt": datetime.now().isoformat()
        }
        msgs_col.insert_one(new_msg)
        new_msg.pop("_id")
        return new_msg
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/{tree_id}", response_model=List[Message])
def get_messages(tree_id: str):
    check_db()
    try:
        cursor = msgs_col.find({"treeId": tree_id}, {"_id": 0})
        msgs = list(cursor)
        msgs.sort(key=lambda x: x["createdAt"], reverse=True)

        # --- Secret Santa Date Logic (Server Side) ---
        now = datetime.now()
        is_locked = False
        
        # Lock during November (11) and December (12) before the 25th 5AM
        if now.month == 11: 
            is_locked = True
        elif now.month == 12:
            if now.day < 25:
                is_locked = True
            # CHANGED: Changed '5' to '0' (Midnight UTC = 5:30 AM IST)
            elif now.day == 25 and now.hour < 0: 
                is_locked = True
        
        if is_locked:
            for m in msgs:
                # KEEP SENDER, but MASK CONTENT
                m["content"] = "🎁 Wrapped until Dec 25th!"

        return msgs
    except PyMongoError:
        return []

# --- DELETE ENDPOINT ---
@app.delete("/messages/{message_id}")
def delete_message(message_id: str, user_id: str = Query(..., description="The ID of the user requesting deletion")):
    check_db()
    try:
        # 1. Find the message to get the treeId
        message = msgs_col.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        tree_id = message.get("treeId")

        # 2. Find the tree to check the ownerId
        tree = trees_col.find_one({"id": tree_id})
        if not tree:
            raise HTTPException(status_code=404, detail="Associated tree not found")

        # 3. Verify Ownership
        if tree.get("ownerId") != user_id:
            raise HTTPException(status_code=403, detail="Permission denied. Only the tree owner can delete messages.")

        # 4. Delete
        result = msgs_col.delete_one({"id": message_id})
        
        if result.deleted_count == 1:
            return {"status": "deleted", "id": message_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete message")

    except PyMongoError as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database error during deletion")