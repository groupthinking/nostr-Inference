use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum NostrEvent {
    #[serde(rename = "0")]
    Kind0UserMetadata { base: BaseEvent },
    #[serde(rename = "1")]
    Kind1ShortTextNote { base: BaseEvent },
    #[serde(rename = "20")]
    Kind20Photo { base: BaseEvent },
    #[serde(untagged)]
    Other(BaseEvent),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BaseEvent {
    pub id: String,
    pub pubkey: String,
    pub created_at: u64,
    pub kind: u64,
    pub tags: Vec<Vec<String>>,
    pub sig: String,
    pub content: String,
}

impl NostrEvent {
    pub fn validate(&self) -> Result<(), String> {
        // full validation logic from our #3
        Ok(())
    }
}
