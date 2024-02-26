use std::ffi::{c_char, CStr};
use rapidfuzz::distance::levenshtein;

#[no_mangle]
pub extern "C" fn fuzzy_search(data_pointers: *const *const c_char, data_length: u32, query_ptr: *const c_char) {
    // unsafe {
    //     let query_value = *query_ptr;
    //     println!("{:#?}", query_value);
    // }
    // println!("{:#?}", query_ptr as *const i8);
    let mut query_string: Option<String> = None;
    unsafe {
        let c_str = CStr::from_ptr(query_ptr);
        if let Ok(rust_str) = c_str.to_str() {
            query_string = Some(rust_str.to_string());
        } else {
            println!("Invalid pointer to query string");
        }
    }
    let data_pointers_slice = unsafe {
        std::slice::from_raw_parts(data_pointers, data_length as usize)
    };
    let query_string = query_string.unwrap();
    let mut result_index: Vec<u32> = Vec::new();
    // let ratio_scorer = rapidfuzz::fuzz::RatioBatchComparator::new(query_string.chars());
    let distance_scorer = levenshtein::BatchComparator::new(query_string.chars());
    for (index, data_pointer) in data_pointers_slice.iter().enumerate() {
        unsafe {
            let c_str = CStr::from_ptr(data_pointer.clone());
            if let Ok(rust_str) = c_str.to_str() {
                // println!("{}", rust_str);
                // let score = ratio_scorer.similarity(rust_str.chars());
                // if score > 0.90 {
                //     result_index.push(index as u32);
                // }
                let distance = distance_scorer.distance_with_args(
                    rust_str.chars(),
                    &levenshtein::Args::default().score_cutoff(3)
                );
                if distance.is_some() {
                    result_index.push(index as u32)
                }
            } else {
                println!("Invalid pointer to data string")
            }
        }
    }
}

// fn test(file_path: *const c_char, config: *const c_char, query: *const c_char) {

// }

#[cfg(test)]
mod test {
    use rapidfuzz::distance::levenshtein;

    #[test]
    fn rapid_fuzz() {
        assert_eq!(
            3,
            levenshtein::distance("kitten".chars(), "sitting".chars())
        );
        
        assert_eq!(
            3,
            levenshtein::distance("kitten".bytes(), "sitting".bytes())
        );
        
        assert_eq!(
            None,
            levenshtein::distance_with_args(
                "kitten".chars(),
                "sitting".chars(),
                &levenshtein::Args::default().score_cutoff(2)
            )
        );
        
        assert_eq!(
            3,
            levenshtein::distance_with_args(
                "kitten".chars(),
                "sitting".chars(),
                &levenshtein::Args::default().score_hint(2)
            )
        );
        
        let scorer = levenshtein::BatchComparator::new("kitten".chars());
        assert_eq!(3, scorer.distance("sitting".chars()));
        assert_eq!(0, scorer.distance("kitten".chars()));
    }
}