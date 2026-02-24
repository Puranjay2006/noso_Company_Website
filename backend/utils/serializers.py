from datetime import datetime
from bson import ObjectId
from typing import Any, Dict, List, Union


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None

    doc = dict(doc)

    # Convert ObjectId to string
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])

    # Recursively process all fields
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, dict):
            doc[key] = serialize_doc(value)
        elif isinstance(value, list):
            doc[key] = [
                serialize_doc(v) if isinstance(v, (dict, ObjectId, datetime)) else v
                for v in value
            ]

    return doc


def serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert list of MongoDB documents to JSON-serializable list"""
    return [serialize_doc(doc) for doc in docs]
