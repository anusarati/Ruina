use std::cell::OnceCell;

use serde::Deserialize;

use strprox::{wasm::Autocompleter, MeasuredPrefix};
use wasm_bindgen::prelude::*;

thread_local! {
    /// Singleton wrapper for an Autocompleter initialized with the LOR autocomplete data
    static LIBRARIAN: OnceCell<Autocompleter> = OnceCell::new();
}

#[wasm_bindgen]
/// Autocompletion using a preinitialized index for LOR
pub fn autocomplete(query: &str, requested: usize) -> Vec<MeasuredPrefix> {
    LIBRARIAN.with(|cell| {
        let librarian = cell.get().unwrap();
        librarian.autocomplete(query, requested)
    })
}

const AUTOCOMPLETE_DATA: &str = include_str!("lowerAutocomplete.json");
#[derive(Deserialize)]
/// The JSON is expected to be in the form {"data" : [string]}, like autocomplete.json
struct AutocompleteImport {
    data: Vec<String>,
}

fn summon_librarian() -> Autocompleter {
    let import: AutocompleteImport = serde_json::from_str(AUTOCOMPLETE_DATA).unwrap();
    // convert the strings to static references
    let static_refs: Vec<&'static str> = import
        .data
        .into_iter()
        .map(|string| Box::leak(Box::new(string)).as_str())
        .collect();
    // make the slice static
    let slice: &'static [&'static str] = Box::leak(Box::new(static_refs)).as_slice();
    let librarian = strprox::Autocompleter::new(slice);
    librarian.into()
}

#[export_name = "wizer.initialize"]
/// Do indexing during the build, not during Lambda startup
pub fn init() {
    LIBRARIAN.with(|cell| {
        let result = cell.set(summon_librarian());
        if result.is_err() {
            panic!("Librarian already initialized.");
        }
    });
}
